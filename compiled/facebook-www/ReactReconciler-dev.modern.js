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
__DEV__ &&
  ((module.exports = function ($$$config) {
    function findHook(fiber, id) {
      for (fiber = fiber.memoizedState; null !== fiber && 0 < id; )
        (fiber = fiber.next), id--;
      return fiber;
    }
    function copyWithSetImpl(obj, path, index, value) {
      if (index >= path.length) return value;
      var key = path[index],
        updated = isArrayImpl(obj) ? obj.slice() : assign({}, obj);
      updated[key] = copyWithSetImpl(obj[key], path, index + 1, value);
      return updated;
    }
    function copyWithRename(obj, oldPath, newPath) {
      if (oldPath.length !== newPath.length)
        console.warn("copyWithRename() expects paths of the same length");
      else {
        for (var i = 0; i < newPath.length - 1; i++)
          if (oldPath[i] !== newPath[i]) {
            console.warn(
              "copyWithRename() expects paths to be the same except for the deepest key"
            );
            return;
          }
        return copyWithRenameImpl(obj, oldPath, newPath, 0);
      }
    }
    function copyWithRenameImpl(obj, oldPath, newPath, index) {
      var oldKey = oldPath[index],
        updated = isArrayImpl(obj) ? obj.slice() : assign({}, obj);
      index + 1 === oldPath.length
        ? ((updated[newPath[index]] = updated[oldKey]),
          isArrayImpl(updated)
            ? updated.splice(oldKey, 1)
            : delete updated[oldKey])
        : (updated[oldKey] = copyWithRenameImpl(
            obj[oldKey],
            oldPath,
            newPath,
            index + 1
          ));
      return updated;
    }
    function copyWithDeleteImpl(obj, path, index) {
      var key = path[index],
        updated = isArrayImpl(obj) ? obj.slice() : assign({}, obj);
      if (index + 1 === path.length)
        return (
          isArrayImpl(updated) ? updated.splice(key, 1) : delete updated[key],
          updated
        );
      updated[key] = copyWithDeleteImpl(obj[key], path, index + 1);
      return updated;
    }
    function shouldSuspendImpl() {
      return !1;
    }
    function shouldErrorImpl() {
      return null;
    }
    function scheduleRoot(root, element) {
      root.context === emptyContextObject &&
        (updateContainerSync(element, root, null, null), flushSyncWork());
    }
    function scheduleRefresh(root, update) {
      if (null !== resolveFamily) {
        var staleFamilies = update.staleFamilies;
        update = update.updatedFamilies;
        flushPendingEffects();
        scheduleFibersWithFamiliesRecursively(
          root.current,
          update,
          staleFamilies
        );
        flushSyncWork();
      }
    }
    function setRefreshHandler(handler) {
      resolveFamily = handler;
    }
    function warnInvalidHookAccess() {
      console.error(
        "Do not call Hooks inside useEffect(...), useMemo(...), or other built-in Hooks. You can only call Hooks at the top level of your React function. For more information, see https://react.dev/link/rules-of-hooks"
      );
    }
    function warnInvalidContextAccess() {
      console.error(
        "Context can only be read while React is rendering. In classes, you can read it in the render method or getDerivedStateFromProps. In function components, you can read it directly in the function body, but not inside Hooks like useReducer() or useMemo()."
      );
    }
    function noop() {}
    function warnForMissingKey() {}
    function setToSortedString(set) {
      var array = [];
      set.forEach(function (value) {
        array.push(value);
      });
      return array.sort().join(", ");
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
        throw Error("Unable to find node on an unmounted component.");
    }
    function findCurrentFiberUsingSlowPath(fiber) {
      var alternate = fiber.alternate;
      if (!alternate) {
        alternate = getNearestMountedFiber(fiber);
        if (null === alternate)
          throw Error("Unable to find node on an unmounted component.");
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
          throw Error("Unable to find node on an unmounted component.");
        }
        if (a.return !== b.return) (a = parentA), (b = parentB);
        else {
          for (var didFindChild = !1, _child = parentA.child; _child; ) {
            if (_child === a) {
              didFindChild = !0;
              a = parentA;
              b = parentB;
              break;
            }
            if (_child === b) {
              didFindChild = !0;
              b = parentA;
              a = parentB;
              break;
            }
            _child = _child.sibling;
          }
          if (!didFindChild) {
            for (_child = parentB.child; _child; ) {
              if (_child === a) {
                didFindChild = !0;
                a = parentB;
                b = parentA;
                break;
              }
              if (_child === b) {
                didFindChild = !0;
                b = parentB;
                a = parentA;
                break;
              }
              _child = _child.sibling;
            }
            if (!didFindChild)
              throw Error(
                "Child was not found in either parent set. This indicates a bug in React related to the return pointer. Please file an issue."
              );
          }
        }
        if (a.alternate !== b)
          throw Error(
            "Return fibers should always be each others' alternates. This error is likely caused by a bug in React. Please file an issue."
          );
      }
      if (3 !== a.tag)
        throw Error("Unable to find node on an unmounted component.");
      return a.stateNode.current === a ? fiber : alternate;
    }
    function findCurrentHostFiber(parent) {
      parent = findCurrentFiberUsingSlowPath(parent);
      return null !== parent ? findCurrentHostFiberImpl(parent) : null;
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
    function findCurrentHostFiberWithNoPortalsImpl(node) {
      var tag = node.tag;
      if (5 === tag || 26 === tag || 27 === tag || 6 === tag) return node;
      for (node = node.child; null !== node; ) {
        if (
          4 !== node.tag &&
          ((tag = findCurrentHostFiberWithNoPortalsImpl(node)), null !== tag)
        )
          return tag;
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
    function getIteratorFn(maybeIterable) {
      if (null === maybeIterable || "object" !== typeof maybeIterable)
        return null;
      maybeIterable =
        (MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL]) ||
        maybeIterable["@@iterator"];
      return "function" === typeof maybeIterable ? maybeIterable : null;
    }
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
        case REACT_VIEW_TRANSITION_TYPE:
          if (enableViewTransition) return "ViewTransition";
        case REACT_TRACING_MARKER_TYPE:
          if (enableTransitionTracing) return "TracingMarker";
      }
      if ("object" === typeof type)
        switch (
          ("number" === typeof type.tag &&
            console.error(
              "Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."
            ),
          type.$$typeof)
        ) {
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
          if (enableViewTransition) return "ViewTransition";
        case 17:
        case 28:
          break;
        case 1:
        case 0:
        case 14:
        case 15:
          if ("function" === typeof type)
            return type.displayName || type.name || null;
          if ("string" === typeof type) return type;
          break;
        case 23:
          return "LegacyHidden";
        case 29:
          type = fiber._debugInfo;
          if (null != type)
            for (var i = type.length - 1; 0 <= i; i--)
              if ("string" === typeof type[i].name) return type[i].name;
          if (null !== fiber.return)
            return getComponentNameFromFiber(fiber.return);
      }
      return null;
    }
    function createCursor(defaultValue) {
      return { current: defaultValue };
    }
    function pop(cursor, fiber) {
      0 > index$jscomp$0
        ? console.error("Unexpected pop.")
        : (fiber !== fiberStack[index$jscomp$0] &&
            console.error("Unexpected Fiber popped."),
          (cursor.current = valueStack[index$jscomp$0]),
          (valueStack[index$jscomp$0] = null),
          (fiberStack[index$jscomp$0] = null),
          index$jscomp$0--);
    }
    function push(cursor, value, fiber) {
      index$jscomp$0++;
      valueStack[index$jscomp$0] = cursor.current;
      fiberStack[index$jscomp$0] = fiber;
      cursor.current = value;
    }
    function clz32Fallback(x) {
      x >>>= 0;
      return 0 === x ? 32 : (31 - ((log$1(x) / LN2) | 0)) | 0;
    }
    function getLabelForLane(lane) {
      if (enableSchedulingProfiler) {
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
    }
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
          return (
            console.error(
              "Should have found matching lanes. This is a bug in React."
            ),
            lanes
          );
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
                    (nextLanes =
                      getHighestPriorityLanes(rootHasPendingCommit)))))
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
          return currentTime + syncLaneExpirationMs;
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
          return currentTime + transitionLaneExpirationMs;
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
          return enableRetryLaneExpiration
            ? currentTime + retryLaneExpirationMs
            : -1;
        case 67108864:
        case 134217728:
        case 268435456:
        case 536870912:
        case 1073741824:
          return -1;
        default:
          return (
            console.error(
              "Should have found matching lanes. This is a bug in React."
            ),
            -1
          );
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
        var index = 31 - clz32(remainingLanes),
          lane = 1 << index;
        entanglements[index] = 0;
        expirationTimes[index] = -1;
        var hiddenUpdatesForLane = hiddenUpdates[index];
        if (null !== hiddenUpdatesForLane)
          for (
            hiddenUpdates[index] = null, index = 0;
            index < hiddenUpdatesForLane.length;
            index++
          ) {
            var update = hiddenUpdatesForLane[index];
            null !== update && (update.lane &= -536870913);
          }
        remainingLanes &= ~lane;
      }
      0 !== spawnedLane && markSpawnedDeferredLane(root, spawnedLane, 0);
      0 !== suspendedRetryLanes &&
        0 === updatedLanes &&
        0 !== root.tag &&
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
        var index = 31 - clz32(rootEntangledLanes),
          lane = 1 << index;
        (lane & entangledLanes) | (root[index] & entangledLanes) &&
          (root[index] |= entangledLanes);
        rootEntangledLanes &= ~lane;
      }
    }
    function getBumpedLaneForHydration(root, renderLanes) {
      var renderLane = renderLanes & -renderLanes;
      renderLane =
        0 !== (renderLane & 42)
          ? 1
          : getBumpedLaneForHydrationByLane(renderLane);
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
          var index = 31 - clz32(lanes),
            lane = 1 << index;
          root[index].add(fiber);
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
          var index = 31 - clz32(lanes);
          root = 1 << index;
          index = pendingUpdatersLaneMap[index];
          0 < index.size &&
            (index.forEach(function (fiber) {
              var alternate = fiber.alternate;
              (null !== alternate && memoizedUpdaters.has(alternate)) ||
                memoizedUpdaters.add(fiber);
            }),
            index.clear());
          lanes &= ~root;
        }
    }
    function getTransitionsForLanes(root, lanes) {
      if (!enableTransitionTracing) return null;
      for (var transitionsForLanes = []; 0 < lanes; ) {
        var index = 31 - clz32(lanes),
          lane = 1 << index;
        index = root.transitionLanes[index];
        null !== index &&
          index.forEach(function (transition) {
            transitionsForLanes.push(transition);
          });
        lanes &= ~lane;
      }
      return 0 === transitionsForLanes.length ? null : transitionsForLanes;
    }
    function clearTransitionsForLanes(root, lanes) {
      if (enableTransitionTracing)
        for (; 0 < lanes; ) {
          var index = 31 - clz32(lanes),
            lane = 1 << index;
          null !== root.transitionLanes[index] &&
            (root.transitionLanes[index] = null);
          lanes &= ~lane;
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
    function injectInternals(internals) {
      if ("undefined" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__) return !1;
      var hook = __REACT_DEVTOOLS_GLOBAL_HOOK__;
      if (hook.isDisabled) return !0;
      if (!hook.supportsFiber)
        return (
          console.error(
            "The installed version of React DevTools is too old and will not work with the current version of React. Please update React DevTools. https://react.dev/link/react-devtools"
          ),
          !0
        );
      try {
        (rendererID = hook.inject(internals)), (injectedHook = hook);
      } catch (err) {
        console.error("React instrumentation encountered an error: %o.", err);
      }
      return hook.checkDCE ? !0 : !1;
    }
    function onCommitRoot$1(root, eventPriority) {
      if (injectedHook && "function" === typeof injectedHook.onCommitFiberRoot)
        try {
          var didError = 128 === (root.current.flags & 128);
          switch (eventPriority) {
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
            root,
            schedulerPriority,
            didError
          );
        } catch (err) {
          hasLoggedError ||
            ((hasLoggedError = !0),
            console.error(
              "React instrumentation encountered an error: %o",
              err
            ));
        }
    }
    function setIsStrictModeForDevtools(newIsStrictMode) {
      "function" === typeof log &&
        unstable_setDisableYieldValue(newIsStrictMode);
      if (injectedHook && "function" === typeof injectedHook.setStrictMode)
        try {
          injectedHook.setStrictMode(rendererID, newIsStrictMode);
        } catch (err) {
          hasLoggedError ||
            ((hasLoggedError = !0),
            console.error(
              "React instrumentation encountered an error: %o",
              err
            ));
        }
    }
    function injectProfilingHooks(profilingHooks) {
      injectedProfilingHooks = profilingHooks;
    }
    function markCommitStopped() {
      enableSchedulingProfiler &&
        null !== injectedProfilingHooks &&
        "function" === typeof injectedProfilingHooks.markCommitStopped &&
        injectedProfilingHooks.markCommitStopped();
    }
    function markComponentRenderStarted(fiber) {
      enableSchedulingProfiler &&
        null !== injectedProfilingHooks &&
        "function" ===
          typeof injectedProfilingHooks.markComponentRenderStarted &&
        injectedProfilingHooks.markComponentRenderStarted(fiber);
    }
    function markComponentRenderStopped() {
      enableSchedulingProfiler &&
        null !== injectedProfilingHooks &&
        "function" ===
          typeof injectedProfilingHooks.markComponentRenderStopped &&
        injectedProfilingHooks.markComponentRenderStopped();
    }
    function markRenderStarted(lanes) {
      enableSchedulingProfiler &&
        null !== injectedProfilingHooks &&
        "function" === typeof injectedProfilingHooks.markRenderStarted &&
        injectedProfilingHooks.markRenderStarted(lanes);
    }
    function markRenderStopped() {
      enableSchedulingProfiler &&
        null !== injectedProfilingHooks &&
        "function" === typeof injectedProfilingHooks.markRenderStopped &&
        injectedProfilingHooks.markRenderStopped();
    }
    function markStateUpdateScheduled(fiber, lane) {
      enableSchedulingProfiler &&
        null !== injectedProfilingHooks &&
        "function" === typeof injectedProfilingHooks.markStateUpdateScheduled &&
        injectedProfilingHooks.markStateUpdateScheduled(fiber, lane);
    }
    function getViewTransitionName(props, instance) {
      if (null != props.name && "auto" !== props.name) return props.name;
      if (null !== instance.autoName) return instance.autoName;
      props = pendingEffectsRoot.identifierPrefix;
      var globalClientId = globalClientIdCounter$1++;
      props = "_" + props + "t_" + globalClientId.toString(32) + "_";
      return (instance.autoName = props);
    }
    function getClassNameByType(classByType) {
      if (null == classByType || "string" === typeof classByType)
        return classByType;
      var className = null,
        activeTypes = pendingTransitionTypes;
      if (null !== activeTypes)
        for (var i = 0; i < activeTypes.length; i++) {
          var match = classByType[activeTypes[i]];
          if (null != match) {
            if ("none" === match) return "none";
            className = null == className ? match : className + (" " + match);
          }
        }
      return null == className ? classByType.default : className;
    }
    function getViewTransitionClassName(defaultClass, eventClass) {
      defaultClass = getClassNameByType(defaultClass);
      eventClass = getClassNameByType(eventClass);
      return null == eventClass
        ? "auto" === defaultClass
          ? null
          : defaultClass
        : "auto" === eventClass
          ? null
          : eventClass;
    }
    function is(x, y) {
      return (x === y && (0 !== x || 1 / x === 1 / y)) || (x !== x && y !== y);
    }
    function getArrayKind(array) {
      for (var kind = 0, i = 0; i < array.length && 100 > i; i++) {
        var value = array[i];
        if ("object" === typeof value && null !== value)
          if (
            isArrayImpl(value) &&
            2 === value.length &&
            "string" === typeof value[0]
          ) {
            if (0 !== kind && 3 !== kind) return 1;
            kind = 3;
          } else return 1;
        else {
          if (
            "function" === typeof value ||
            ("string" === typeof value && 50 < value.length) ||
            (0 !== kind && 2 !== kind)
          )
            return 1;
          kind = 2;
        }
      }
      return kind;
    }
    function addObjectToProperties(object, properties, indent, prefix) {
      var addedProperties = 0,
        key;
      for (key in object)
        if (
          hasOwnProperty.call(object, key) &&
          "_" !== key[0] &&
          (addedProperties++,
          addValueToProperties(key, object[key], properties, indent, prefix),
          100 <= addedProperties)
        ) {
          properties.push([
            prefix +
              "\u00a0\u00a0".repeat(indent) +
              "Only 100 properties are shown. React will not log more properties of this object.",
            ""
          ]);
          break;
        }
    }
    function addValueToProperties(
      propertyName,
      value,
      properties,
      indent,
      prefix
    ) {
      switch (typeof value) {
        case "object":
          if (null === value) {
            value = "null";
            break;
          } else {
            if (value.$$typeof === REACT_ELEMENT_TYPE) {
              var typeName = getComponentNameFromType(value.type) || "\u2026",
                key = value.key;
              value = value.props;
              var propsKeys = Object.keys(value),
                propsLength = propsKeys.length;
              if (null == key && 0 === propsLength) {
                value = "<" + typeName + " />";
                break;
              }
              if (
                3 > indent ||
                (1 === propsLength &&
                  "children" === propsKeys[0] &&
                  null == key)
              ) {
                value = "<" + typeName + " \u2026 />";
                break;
              }
              properties.push([
                prefix + "\u00a0\u00a0".repeat(indent) + propertyName,
                "<" + typeName
              ]);
              null !== key &&
                addValueToProperties(
                  "key",
                  key,
                  properties,
                  indent + 1,
                  prefix
                );
              propertyName = !1;
              key = 0;
              for (var propKey in value)
                if (
                  (key++,
                  "children" === propKey
                    ? null != value.children &&
                      (!isArrayImpl(value.children) ||
                        0 < value.children.length) &&
                      (propertyName = !0)
                    : hasOwnProperty.call(value, propKey) &&
                      "_" !== propKey[0] &&
                      addValueToProperties(
                        propKey,
                        value[propKey],
                        properties,
                        indent + 1,
                        prefix
                      ),
                  100 <= key)
                )
                  break;
              properties.push([
                "",
                propertyName ? ">\u2026</" + typeName + ">" : "/>"
              ]);
              return;
            }
            typeName = Object.prototype.toString.call(value);
            propKey = typeName.slice(8, typeName.length - 1);
            if ("Array" === propKey)
              if (
                ((typeName = 100 < value.length),
                (key = getArrayKind(value)),
                2 === key || 0 === key)
              ) {
                value = JSON.stringify(
                  typeName ? value.slice(0, 100).concat("\u2026") : value
                );
                break;
              } else if (3 === key) {
                properties.push([
                  prefix + "\u00a0\u00a0".repeat(indent) + propertyName,
                  ""
                ]);
                for (
                  propertyName = 0;
                  propertyName < value.length && 100 > propertyName;
                  propertyName++
                )
                  (propKey = value[propertyName]),
                    addValueToProperties(
                      propKey[0],
                      propKey[1],
                      properties,
                      indent + 1,
                      prefix
                    );
                typeName &&
                  addValueToProperties(
                    (100).toString(),
                    "\u2026",
                    properties,
                    indent + 1,
                    prefix
                  );
                return;
              }
            if ("Promise" === propKey) {
              if ("fulfilled" === value.status) {
                if (
                  ((typeName = properties.length),
                  addValueToProperties(
                    propertyName,
                    value.value,
                    properties,
                    indent,
                    prefix
                  ),
                  properties.length > typeName)
                ) {
                  properties = properties[typeName];
                  properties[1] =
                    "Promise<" + (properties[1] || "Object") + ">";
                  return;
                }
              } else if (
                "rejected" === value.status &&
                ((typeName = properties.length),
                addValueToProperties(
                  propertyName,
                  value.reason,
                  properties,
                  indent,
                  prefix
                ),
                properties.length > typeName)
              ) {
                properties = properties[typeName];
                properties[1] = "Rejected Promise<" + properties[1] + ">";
                return;
              }
              properties.push([
                "\u00a0\u00a0".repeat(indent) + propertyName,
                "Promise"
              ]);
              return;
            }
            "Object" === propKey &&
              (typeName = Object.getPrototypeOf(value)) &&
              "function" === typeof typeName.constructor &&
              (propKey = typeName.constructor.name);
            properties.push([
              prefix + "\u00a0\u00a0".repeat(indent) + propertyName,
              "Object" === propKey ? (3 > indent ? "" : "\u2026") : propKey
            ]);
            3 > indent &&
              addObjectToProperties(value, properties, indent + 1, prefix);
            return;
          }
        case "function":
          value = "" === value.name ? "() => {}" : value.name + "() {}";
          break;
        case "string":
          value =
            "This object has been omitted by React in the console log to avoid sending too much data from the server. Try logging smaller or more specific objects." ===
            value
              ? "\u2026"
              : JSON.stringify(value);
          break;
        case "undefined":
          value = "undefined";
          break;
        case "boolean":
          value = value ? "true" : "false";
          break;
        default:
          value = String(value);
      }
      properties.push([
        prefix + "\u00a0\u00a0".repeat(indent) + propertyName,
        value
      ]);
    }
    function addObjectDiffToProperties(prev, next, properties, indent) {
      var isDeeplyEqual = !0,
        prevPropertiesChecked = 0;
      for (key in prev) {
        if (100 < prevPropertiesChecked) {
          properties.push([
            "Previous object has more than 100 properties. React will not attempt to diff objects with too many properties.",
            ""
          ]);
          isDeeplyEqual = !1;
          break;
        }
        key in next ||
          (properties.push([
            "\u2013\u00a0" + "\u00a0\u00a0".repeat(indent) + key,
            "\u2026"
          ]),
          (isDeeplyEqual = !1));
        prevPropertiesChecked++;
      }
      prevPropertiesChecked = 0;
      for (var _key in next) {
        if (100 < prevPropertiesChecked) {
          properties.push([
            "Next object has more than 100 properties. React will not attempt to diff objects with too many properties.",
            ""
          ]);
          isDeeplyEqual = !1;
          break;
        }
        if (_key in prev) {
          var key = prev[_key];
          var nextValue = next[_key];
          if (key !== nextValue) {
            if (0 === indent && "children" === _key) {
              isDeeplyEqual = "\u00a0\u00a0".repeat(indent) + _key;
              properties.push(
                ["\u2013\u00a0" + isDeeplyEqual, "\u2026"],
                ["+\u00a0" + isDeeplyEqual, "\u2026"]
              );
              isDeeplyEqual = !1;
              continue;
            }
            if (!(3 <= indent))
              if (
                "object" === typeof key &&
                "object" === typeof nextValue &&
                null !== key &&
                null !== nextValue &&
                key.$$typeof === nextValue.$$typeof
              )
                if (nextValue.$$typeof === REACT_ELEMENT_TYPE) {
                  if (
                    key.type === nextValue.type &&
                    key.key === nextValue.key
                  ) {
                    key = getComponentNameFromType(nextValue.type) || "\u2026";
                    isDeeplyEqual = "\u00a0\u00a0".repeat(indent) + _key;
                    key = "<" + key + " \u2026 />";
                    properties.push(
                      ["\u2013\u00a0" + isDeeplyEqual, key],
                      ["+\u00a0" + isDeeplyEqual, key]
                    );
                    isDeeplyEqual = !1;
                    continue;
                  }
                } else {
                  var prevKind = Object.prototype.toString.call(key),
                    nextKind = Object.prototype.toString.call(nextValue);
                  if (
                    prevKind === nextKind &&
                    ("[object Object]" === nextKind ||
                      "[object Array]" === nextKind)
                  ) {
                    prevKind = [
                      "\u2007\u00a0" + "\u00a0\u00a0".repeat(indent) + _key,
                      "[object Array]" === nextKind ? "Array" : ""
                    ];
                    properties.push(prevKind);
                    nextKind = properties.length;
                    addObjectDiffToProperties(
                      key,
                      nextValue,
                      properties,
                      indent + 1
                    )
                      ? nextKind === properties.length &&
                        (prevKind[1] =
                          "Referentially unequal but deeply equal objects. Consider memoization.")
                      : (isDeeplyEqual = !1);
                    continue;
                  }
                }
              else if (
                "function" === typeof key &&
                "function" === typeof nextValue &&
                key.name === nextValue.name &&
                key.length === nextValue.length &&
                ((prevKind = Function.prototype.toString.call(key)),
                (nextKind = Function.prototype.toString.call(nextValue)),
                prevKind === nextKind)
              ) {
                key =
                  "" === nextValue.name ? "() => {}" : nextValue.name + "() {}";
                properties.push([
                  "\u2007\u00a0" + "\u00a0\u00a0".repeat(indent) + _key,
                  key +
                    " Referentially unequal function closure. Consider memoization."
                ]);
                continue;
              }
            addValueToProperties(_key, key, properties, indent, "\u2013\u00a0");
            addValueToProperties(
              _key,
              nextValue,
              properties,
              indent,
              "+\u00a0"
            );
            isDeeplyEqual = !1;
          }
        } else
          properties.push([
            "+\u00a0" + "\u00a0\u00a0".repeat(indent) + _key,
            "\u2026"
          ]),
            (isDeeplyEqual = !1);
        prevPropertiesChecked++;
      }
      return isDeeplyEqual;
    }
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
        (fiber = fiber._debugTask)
          ? fiber.run(
              performance.measure.bind(
                performance,
                trigger,
                reusableComponentOptions
              )
            )
          : performance.measure(trigger, reusableComponentOptions),
        performance.clearMeasures(trigger));
    }
    function logComponentReappeared(fiber, startTime, endTime) {
      logComponentTrigger(fiber, startTime, endTime, "Reconnect");
    }
    function logComponentRender(
      fiber,
      startTime,
      endTime,
      wasHydrated,
      committedLanes
    ) {
      var name = getComponentNameFromFiber(fiber);
      if (null !== name && supportsUserTiming) {
        var alternate = fiber.alternate,
          selfTime = fiber.actualDuration;
        if (null === alternate || alternate.child !== fiber.child)
          for (var child = fiber.child; null !== child; child = child.sibling)
            selfTime -= child.actualDuration;
        selfTime =
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
                : "error";
        var props = fiber.memoizedProps;
        wasHydrated = fiber._debugTask;
        null !== props &&
        null !== alternate &&
        alternate.memoizedProps !== props
          ? ((child = [reusableChangedPropsEntry]),
            (props = addObjectDiffToProperties(
              alternate.memoizedProps,
              props,
              child,
              0
            )),
            1 < child.length
              ? (props &&
                !alreadyWarnedForDeepEquality &&
                0 === (alternate.lanes & committedLanes) &&
                100 < fiber.actualDuration
                  ? ((alreadyWarnedForDeepEquality = !0),
                    (child[0] = reusableDeeplyEqualPropsEntry),
                    (reusableComponentDevToolDetails.color = "warning"),
                    (reusableComponentDevToolDetails.tooltipText =
                      "This component received deeply equal props. It might benefit from useMemo or the React Compiler in its owner."))
                  : ((reusableComponentDevToolDetails.color = selfTime),
                    (reusableComponentDevToolDetails.tooltipText = name)),
                (reusableComponentDevToolDetails.properties = child),
                (reusableComponentOptions.start = startTime),
                (reusableComponentOptions.end = endTime),
                (fiber = "\u200b" + name),
                null != wasHydrated
                  ? wasHydrated.run(
                      performance.measure.bind(
                        performance,
                        fiber,
                        reusableComponentOptions
                      )
                    )
                  : performance.measure(fiber, reusableComponentOptions),
                performance.clearMeasures(fiber))
              : null != wasHydrated
                ? wasHydrated.run(
                    console.timeStamp.bind(
                      console,
                      name,
                      startTime,
                      endTime,
                      "Components \u269b",
                      void 0,
                      selfTime
                    )
                  )
                : console.timeStamp(
                    name,
                    startTime,
                    endTime,
                    "Components \u269b",
                    void 0,
                    selfTime
                  ))
          : null != wasHydrated
            ? wasHydrated.run(
                console.timeStamp.bind(
                  console,
                  name,
                  startTime,
                  endTime,
                  "Components \u269b",
                  void 0,
                  selfTime
                )
              )
            : console.timeStamp(
                name,
                startTime,
                endTime,
                "Components \u269b",
                void 0,
                selfTime
              );
      }
    }
    function logComponentErrored(fiber, startTime, endTime, errors) {
      if (supportsUserTiming) {
        var name = getComponentNameFromFiber(fiber);
        if (null !== name) {
          for (
            var debugTask = null, properties = [], i = 0;
            i < errors.length;
            i++
          ) {
            var capturedValue = errors[i];
            null == debugTask &&
              null !== capturedValue.source &&
              (debugTask = capturedValue.source._debugTask);
            capturedValue = capturedValue.value;
            properties.push([
              "Error",
              "object" === typeof capturedValue &&
              null !== capturedValue &&
              "string" === typeof capturedValue.message
                ? String(capturedValue.message)
                : String(capturedValue)
            ]);
          }
          null !== fiber.key &&
            addValueToProperties("key", fiber.key, properties, 0, "");
          null !== fiber.memoizedProps &&
            addObjectToProperties(fiber.memoizedProps, properties, 0, "");
          null == debugTask && (debugTask = fiber._debugTask);
          fiber = {
            start: startTime,
            end: endTime,
            detail: {
              devtools: {
                color: "error",
                track: "Components \u269b",
                tooltipText:
                  13 === fiber.tag
                    ? "Hydration failed"
                    : "Error boundary caught an error",
                properties: properties
              }
            }
          };
          name = "\u200b" + name;
          debugTask
            ? debugTask.run(performance.measure.bind(performance, name, fiber))
            : performance.measure(name, fiber);
          performance.clearMeasures(name);
        }
      }
    }
    function logComponentEffect(fiber, startTime, endTime, selfTime, errors) {
      if (null !== errors) {
        if (supportsUserTiming) {
          var name = getComponentNameFromFiber(fiber);
          if (null !== name) {
            selfTime = [];
            for (var i = 0; i < errors.length; i++) {
              var error = errors[i].value;
              selfTime.push([
                "Error",
                "object" === typeof error &&
                null !== error &&
                "string" === typeof error.message
                  ? String(error.message)
                  : String(error)
              ]);
            }
            null !== fiber.key &&
              addValueToProperties("key", fiber.key, selfTime, 0, "");
            null !== fiber.memoizedProps &&
              addObjectToProperties(fiber.memoizedProps, selfTime, 0, "");
            startTime = {
              start: startTime,
              end: endTime,
              detail: {
                devtools: {
                  color: "error",
                  track: "Components \u269b",
                  tooltipText: "A lifecycle or effect errored",
                  properties: selfTime
                }
              }
            };
            fiber = fiber._debugTask;
            endTime = "\u200b" + name;
            fiber
              ? fiber.run(
                  performance.measure.bind(performance, endTime, startTime)
                )
              : performance.measure(endTime, startTime);
            performance.clearMeasures(endTime);
          }
        }
      } else
        (name = getComponentNameFromFiber(fiber)),
          null !== name &&
            supportsUserTiming &&
            ((errors =
              1 > selfTime
                ? "secondary-light"
                : 100 > selfTime
                  ? "secondary"
                  : 500 > selfTime
                    ? "secondary-dark"
                    : "error"),
            (fiber = fiber._debugTask)
              ? fiber.run(
                  console.timeStamp.bind(
                    console,
                    name,
                    startTime,
                    endTime,
                    "Components \u269b",
                    void 0,
                    errors
                  )
                )
              : console.timeStamp(
                  name,
                  startTime,
                  endTime,
                  "Components \u269b",
                  void 0,
                  errors
                ));
    }
    function logRenderPhase(startTime, endTime, lanes, debugTask) {
      if (supportsUserTiming && !(endTime <= startTime)) {
        var color =
          (lanes & 738197653) === lanes ? "tertiary-dark" : "primary-dark";
        lanes =
          (lanes & 536870912) === lanes
            ? "Prepared"
            : (lanes & 201326741) === lanes
              ? "Hydrated"
              : "Render";
        debugTask
          ? debugTask.run(
              console.timeStamp.bind(
                console,
                lanes,
                startTime,
                endTime,
                currentTrack,
                "Scheduler \u269b",
                color
              )
            )
          : console.timeStamp(
              lanes,
              startTime,
              endTime,
              currentTrack,
              "Scheduler \u269b",
              color
            );
      }
    }
    function logSuspendedRenderPhase(startTime, endTime, lanes, debugTask) {
      !supportsUserTiming ||
        endTime <= startTime ||
        ((lanes =
          (lanes & 738197653) === lanes ? "tertiary-dark" : "primary-dark"),
        debugTask
          ? debugTask.run(
              console.timeStamp.bind(
                console,
                "Prewarm",
                startTime,
                endTime,
                currentTrack,
                "Scheduler \u269b",
                lanes
              )
            )
          : console.timeStamp(
              "Prewarm",
              startTime,
              endTime,
              currentTrack,
              "Scheduler \u269b",
              lanes
            ));
    }
    function logSuspendedWithDelayPhase(startTime, endTime, lanes, debugTask) {
      !supportsUserTiming ||
        endTime <= startTime ||
        ((lanes =
          (lanes & 738197653) === lanes ? "tertiary-dark" : "primary-dark"),
        debugTask
          ? debugTask.run(
              console.timeStamp.bind(
                console,
                "Suspended",
                startTime,
                endTime,
                currentTrack,
                "Scheduler \u269b",
                lanes
              )
            )
          : console.timeStamp(
              "Suspended",
              startTime,
              endTime,
              currentTrack,
              "Scheduler \u269b",
              lanes
            ));
    }
    function logRecoveredRenderPhase(
      startTime,
      endTime,
      lanes,
      recoverableErrors,
      hydrationFailed,
      debugTask
    ) {
      if (supportsUserTiming && !(endTime <= startTime)) {
        lanes = [];
        for (var i = 0; i < recoverableErrors.length; i++) {
          var error = recoverableErrors[i].value;
          lanes.push([
            "Recoverable Error",
            "object" === typeof error &&
            null !== error &&
            "string" === typeof error.message
              ? String(error.message)
              : String(error)
          ]);
        }
        startTime = {
          start: startTime,
          end: endTime,
          detail: {
            devtools: {
              color: "primary-dark",
              track: currentTrack,
              trackGroup: "Scheduler \u269b",
              tooltipText: hydrationFailed
                ? "Hydration Failed"
                : "Recovered after Error",
              properties: lanes
            }
          }
        };
        debugTask
          ? debugTask.run(
              performance.measure.bind(performance, "Recovered", startTime)
            )
          : performance.measure("Recovered", startTime);
        performance.clearMeasures("Recovered");
      }
    }
    function logErroredRenderPhase(startTime, endTime, lanes, debugTask) {
      !supportsUserTiming ||
        endTime <= startTime ||
        (debugTask
          ? debugTask.run(
              console.timeStamp.bind(
                console,
                "Errored",
                startTime,
                endTime,
                currentTrack,
                "Scheduler \u269b",
                "error"
              )
            )
          : console.timeStamp(
              "Errored",
              startTime,
              endTime,
              currentTrack,
              "Scheduler \u269b",
              "error"
            ));
    }
    function logSuspendedCommitPhase(startTime, endTime, reason, debugTask) {
      !supportsUserTiming ||
        endTime <= startTime ||
        (debugTask
          ? debugTask.run(
              console.timeStamp.bind(
                console,
                reason,
                startTime,
                endTime,
                currentTrack,
                "Scheduler \u269b",
                "secondary-light"
              )
            )
          : console.timeStamp(
              reason,
              startTime,
              endTime,
              currentTrack,
              "Scheduler \u269b",
              "secondary-light"
            ));
    }
    function logCommitErrored(startTime, endTime, errors, passive, debugTask) {
      if (supportsUserTiming && !(endTime <= startTime)) {
        for (var properties = [], i = 0; i < errors.length; i++) {
          var error = errors[i].value;
          properties.push([
            "Error",
            "object" === typeof error &&
            null !== error &&
            "string" === typeof error.message
              ? String(error.message)
              : String(error)
          ]);
        }
        startTime = {
          start: startTime,
          end: endTime,
          detail: {
            devtools: {
              color: "error",
              track: currentTrack,
              trackGroup: "Scheduler \u269b",
              tooltipText: passive
                ? "Remaining Effects Errored"
                : "Commit Errored",
              properties: properties
            }
          }
        };
        debugTask
          ? debugTask.run(
              performance.measure.bind(performance, "Errored", startTime)
            )
          : performance.measure("Errored", startTime);
        performance.clearMeasures("Errored");
      }
    }
    function logCommitPhase(
      startTime,
      endTime,
      errors,
      abortedViewTransition,
      debugTask
    ) {
      null !== errors
        ? logCommitErrored(startTime, endTime, errors, !1, debugTask)
        : !supportsUserTiming ||
          endTime <= startTime ||
          (debugTask
            ? debugTask.run(
                console.timeStamp.bind(
                  console,
                  abortedViewTransition
                    ? "Commit Interrupted View Transition"
                    : "Commit",
                  startTime,
                  endTime,
                  currentTrack,
                  "Scheduler \u269b",
                  abortedViewTransition ? "error" : "secondary-dark"
                )
              )
            : console.timeStamp(
                abortedViewTransition
                  ? "Commit Interrupted View Transition"
                  : "Commit",
                startTime,
                endTime,
                currentTrack,
                "Scheduler \u269b",
                abortedViewTransition ? "error" : "secondary-dark"
              ));
    }
    function logPaintYieldPhase(
      startTime,
      endTime,
      delayedUntilPaint,
      debugTask
    ) {
      !supportsUserTiming ||
        endTime <= startTime ||
        (debugTask
          ? debugTask.run(
              console.timeStamp.bind(
                console,
                delayedUntilPaint ? "Waiting for Paint" : "Waiting",
                startTime,
                endTime,
                currentTrack,
                "Scheduler \u269b",
                "secondary-light"
              )
            )
          : console.timeStamp(
              delayedUntilPaint ? "Waiting for Paint" : "Waiting",
              startTime,
              endTime,
              currentTrack,
              "Scheduler \u269b",
              "secondary-light"
            ));
    }
    function logStartViewTransitionYieldPhase(
      startTime,
      endTime,
      abortedViewTransition,
      debugTask
    ) {
      !supportsUserTiming ||
        endTime <= startTime ||
        (debugTask
          ? debugTask.run(
              console.timeStamp.bind(
                console,
                abortedViewTransition
                  ? "Interrupted View Transition"
                  : "Starting Animation",
                startTime,
                endTime,
                currentTrack,
                "Scheduler \u269b",
                abortedViewTransition ? "error" : "secondary-light"
              )
            )
          : console.timeStamp(
              abortedViewTransition
                ? "Interrupted View Transition"
                : "Starting Animation",
              startTime,
              endTime,
              currentTrack,
              "Scheduler \u269b",
              abortedViewTransition ? " error" : "secondary-light"
            ));
    }
    function logAnimatingPhase(startTime, endTime, debugTask) {
      !supportsUserTiming ||
        endTime <= startTime ||
        (debugTask
          ? debugTask.run(
              console.timeStamp.bind(
                console,
                "Animating",
                startTime,
                endTime,
                currentTrack,
                "Scheduler \u269b",
                "secondary-dark"
              )
            )
          : console.timeStamp(
              "Animating",
              startTime,
              endTime,
              currentTrack,
              "Scheduler \u269b",
              "secondary-dark"
            ));
    }
    function logPassiveCommitPhase(startTime, endTime, errors, debugTask) {
      null !== errors
        ? logCommitErrored(startTime, endTime, errors, !0, debugTask)
        : !supportsUserTiming ||
          endTime <= startTime ||
          (debugTask
            ? debugTask.run(
                console.timeStamp.bind(
                  console,
                  "Remaining Effects",
                  startTime,
                  endTime,
                  currentTrack,
                  "Scheduler \u269b",
                  "secondary-dark"
                )
              )
            : console.timeStamp(
                "Remaining Effects",
                startTime,
                endTime,
                currentTrack,
                "Scheduler \u269b",
                "secondary-dark"
              ));
    }
    function disabledLog() {}
    function disableLogs() {
      if (0 === disabledDepth) {
        prevLog = console.log;
        prevInfo = console.info;
        prevWarn = console.warn;
        prevError = console.error;
        prevGroup = console.group;
        prevGroupCollapsed = console.groupCollapsed;
        prevGroupEnd = console.groupEnd;
        var props = {
          configurable: !0,
          enumerable: !0,
          value: disabledLog,
          writable: !0
        };
        Object.defineProperties(console, {
          info: props,
          log: props,
          warn: props,
          error: props,
          group: props,
          groupCollapsed: props,
          groupEnd: props
        });
      }
      disabledDepth++;
    }
    function reenableLogs() {
      disabledDepth--;
      if (0 === disabledDepth) {
        var props = { configurable: !0, enumerable: !0, writable: !0 };
        Object.defineProperties(console, {
          log: assign({}, props, { value: prevLog }),
          info: assign({}, props, { value: prevInfo }),
          warn: assign({}, props, { value: prevWarn }),
          error: assign({}, props, { value: prevError }),
          group: assign({}, props, { value: prevGroup }),
          groupCollapsed: assign({}, props, { value: prevGroupCollapsed }),
          groupEnd: assign({}, props, { value: prevGroupEnd })
        });
      }
      0 > disabledDepth &&
        console.error(
          "disabledDepth fell below zero. This is a bug in React. Please file an issue."
        );
    }
    function formatOwnerStack(error) {
      var prevPrepareStackTrace = Error.prepareStackTrace;
      Error.prepareStackTrace = void 0;
      error = error.stack;
      Error.prepareStackTrace = prevPrepareStackTrace;
      error.startsWith("Error: react-stack-top-frame\n") &&
        (error = error.slice(29));
      prevPrepareStackTrace = error.indexOf("\n");
      -1 !== prevPrepareStackTrace &&
        (error = error.slice(prevPrepareStackTrace + 1));
      prevPrepareStackTrace = error.indexOf("react_stack_bottom_frame");
      -1 !== prevPrepareStackTrace &&
        (prevPrepareStackTrace = error.lastIndexOf(
          "\n",
          prevPrepareStackTrace
        ));
      if (-1 !== prevPrepareStackTrace)
        error = error.slice(0, prevPrepareStackTrace);
      else return "";
      return error;
    }
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
    function describeNativeComponentFrame(fn, construct) {
      if (!fn || reentry) return "";
      var frame = componentFrameCache.get(fn);
      if (void 0 !== frame) return frame;
      reentry = !0;
      frame = Error.prepareStackTrace;
      Error.prepareStackTrace = void 0;
      var previousDispatcher = null;
      previousDispatcher = ReactSharedInternals.H;
      ReactSharedInternals.H = null;
      disableLogs();
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
                  } catch (x$0) {
                    control = x$0;
                  }
                  fn.call(Fake.prototype);
                }
              } else {
                try {
                  throw Error();
                } catch (x$1) {
                  control = x$1;
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
        var _RunInRootFrame$Deter =
            RunInRootFrame.DetermineComponentFrameRoot(),
          sampleStack = _RunInRootFrame$Deter[0],
          controlStack = _RunInRootFrame$Deter[1];
        if (sampleStack && controlStack) {
          var sampleLines = sampleStack.split("\n"),
            controlLines = controlStack.split("\n");
          for (
            _RunInRootFrame$Deter = namePropDescriptor = 0;
            namePropDescriptor < sampleLines.length &&
            !sampleLines[namePropDescriptor].includes(
              "DetermineComponentFrameRoot"
            );

          )
            namePropDescriptor++;
          for (
            ;
            _RunInRootFrame$Deter < controlLines.length &&
            !controlLines[_RunInRootFrame$Deter].includes(
              "DetermineComponentFrameRoot"
            );

          )
            _RunInRootFrame$Deter++;
          if (
            namePropDescriptor === sampleLines.length ||
            _RunInRootFrame$Deter === controlLines.length
          )
            for (
              namePropDescriptor = sampleLines.length - 1,
                _RunInRootFrame$Deter = controlLines.length - 1;
              1 <= namePropDescriptor &&
              0 <= _RunInRootFrame$Deter &&
              sampleLines[namePropDescriptor] !==
                controlLines[_RunInRootFrame$Deter];

            )
              _RunInRootFrame$Deter--;
          for (
            ;
            1 <= namePropDescriptor && 0 <= _RunInRootFrame$Deter;
            namePropDescriptor--, _RunInRootFrame$Deter--
          )
            if (
              sampleLines[namePropDescriptor] !==
              controlLines[_RunInRootFrame$Deter]
            ) {
              if (1 !== namePropDescriptor || 1 !== _RunInRootFrame$Deter) {
                do
                  if (
                    (namePropDescriptor--,
                    _RunInRootFrame$Deter--,
                    0 > _RunInRootFrame$Deter ||
                      sampleLines[namePropDescriptor] !==
                        controlLines[_RunInRootFrame$Deter])
                  ) {
                    var _frame =
                      "\n" +
                      sampleLines[namePropDescriptor].replace(
                        " at new ",
                        " at "
                      );
                    fn.displayName &&
                      _frame.includes("<anonymous>") &&
                      (_frame = _frame.replace("<anonymous>", fn.displayName));
                    "function" === typeof fn &&
                      componentFrameCache.set(fn, _frame);
                    return _frame;
                  }
                while (1 <= namePropDescriptor && 0 <= _RunInRootFrame$Deter);
              }
              break;
            }
        }
      } finally {
        (reentry = !1),
          (ReactSharedInternals.H = previousDispatcher),
          reenableLogs(),
          (Error.prepareStackTrace = frame);
      }
      sampleLines = (sampleLines = fn ? fn.displayName || fn.name : "")
        ? describeBuiltInComponentFrame(sampleLines)
        : "";
      "function" === typeof fn && componentFrameCache.set(fn, sampleLines);
      return sampleLines;
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
        case 30:
          if (enableViewTransition)
            return describeBuiltInComponentFrame("ViewTransition");
        default:
          return "";
      }
    }
    function getStackByFiberInDevAndProd(workInProgress) {
      try {
        var info = "",
          previous = null;
        do {
          info += describeFiber(workInProgress, previous);
          var debugInfo = workInProgress._debugInfo;
          if (debugInfo)
            for (var i = debugInfo.length - 1; 0 <= i; i--) {
              var entry = debugInfo[i];
              if ("string" === typeof entry.name) {
                var JSCompiler_temp_const = info;
                a: {
                  var name = entry.name,
                    env = entry.env,
                    location = entry.debugLocation;
                  if (null != location) {
                    var childStack = formatOwnerStack(location),
                      idx = childStack.lastIndexOf("\n"),
                      lastLine =
                        -1 === idx ? childStack : childStack.slice(idx + 1);
                    if (-1 !== lastLine.indexOf(name)) {
                      var JSCompiler_inline_result = "\n" + lastLine;
                      break a;
                    }
                  }
                  JSCompiler_inline_result = describeBuiltInComponentFrame(
                    name + (env ? " [" + env + "]" : "")
                  );
                }
                info = JSCompiler_temp_const + JSCompiler_inline_result;
              }
            }
          previous = workInProgress;
          workInProgress = workInProgress.return;
        } while (workInProgress);
        return info;
      } catch (x) {
        return "\nError generating stack: " + x.message + "\n" + x.stack;
      }
    }
    function describeFunctionComponentFrameWithoutLineNumber(fn) {
      return (fn = fn ? fn.displayName || fn.name : "")
        ? describeBuiltInComponentFrame(fn)
        : "";
    }
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
    function pushTreeFork(workInProgress, totalChildren) {
      warnIfNotHydrating();
      forkStack[forkStackIndex++] = treeForkCount;
      forkStack[forkStackIndex++] = treeForkProvider;
      treeForkProvider = workInProgress;
      treeForkCount = totalChildren;
    }
    function pushTreeId(workInProgress, totalChildren, index) {
      warnIfNotHydrating();
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
      warnIfNotHydrating();
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
    function getSuspendedTreeContext() {
      warnIfNotHydrating();
      return null !== treeContextProvider
        ? { id: treeContextId, overflow: treeContextOverflow }
        : null;
    }
    function restoreSuspendedTreeContext(workInProgress, suspendedContext) {
      warnIfNotHydrating();
      idStack[idStackIndex++] = treeContextId;
      idStack[idStackIndex++] = treeContextOverflow;
      idStack[idStackIndex++] = treeContextProvider;
      treeContextId = suspendedContext.id;
      treeContextOverflow = suspendedContext.overflow;
      treeContextProvider = workInProgress;
    }
    function warnIfNotHydrating() {
      isHydrating ||
        console.error(
          "Expected to be hydrating. This is a bug in React. Please file an issue."
        );
    }
    function requiredContext(c) {
      null === c &&
        console.error(
          "Expected host context to exist. This error is likely caused by a bug in React. Please file an issue."
        );
      return c;
    }
    function pushHostContainer(fiber, nextRootInstance) {
      push(rootInstanceStackCursor, nextRootInstance, fiber);
      push(contextFiberStackCursor, fiber, fiber);
      push(contextStackCursor, null, fiber);
      nextRootInstance = getRootHostContext(nextRootInstance);
      pop(contextStackCursor, fiber);
      push(contextStackCursor, nextRootInstance, fiber);
    }
    function popHostContainer(fiber) {
      pop(contextStackCursor, fiber);
      pop(contextFiberStackCursor, fiber);
      pop(rootInstanceStackCursor, fiber);
    }
    function getHostContext() {
      return requiredContext(contextStackCursor.current);
    }
    function pushHostContext(fiber) {
      null !== fiber.memoizedState &&
        push(hostTransitionProviderCursor, fiber, fiber);
      var context = requiredContext(contextStackCursor.current),
        nextContext = getChildHostContext(context, fiber.type);
      context !== nextContext &&
        (push(contextFiberStackCursor, fiber, fiber),
        push(contextStackCursor, nextContext, fiber));
    }
    function popHostContext(fiber) {
      contextFiberStackCursor.current === fiber &&
        (pop(contextStackCursor, fiber), pop(contextFiberStackCursor, fiber));
      hostTransitionProviderCursor.current === fiber &&
        (pop(hostTransitionProviderCursor, fiber),
        isPrimaryRenderer
          ? (HostTransitionContext._currentValue = NotPendingTransition)
          : (HostTransitionContext._currentValue2 = NotPendingTransition));
    }
    function findNotableNode(node, indent) {
      return void 0 === node.serverProps &&
        0 === node.serverTail.length &&
        1 === node.children.length &&
        3 < node.distanceFromLeaf &&
        node.distanceFromLeaf > 15 - indent
        ? findNotableNode(node.children[0], indent)
        : node;
    }
    function indentation(indent) {
      return "  " + "  ".repeat(indent);
    }
    function added(indent) {
      return "+ " + "  ".repeat(indent);
    }
    function removed(indent) {
      return "- " + "  ".repeat(indent);
    }
    function describeFiberType(fiber) {
      switch (fiber.tag) {
        case 26:
        case 27:
        case 5:
          return fiber.type;
        case 16:
          return "Lazy";
        case 31:
          return "Activity";
        case 13:
          return "Suspense";
        case 19:
          return "SuspenseList";
        case 0:
        case 15:
          return (fiber = fiber.type), fiber.displayName || fiber.name || null;
        case 11:
          return (
            (fiber = fiber.type.render), fiber.displayName || fiber.name || null
          );
        case 1:
          return (fiber = fiber.type), fiber.displayName || fiber.name || null;
        default:
          return null;
      }
    }
    function describeTextNode(content, maxLength) {
      return needsEscaping.test(content)
        ? ((content = JSON.stringify(content)),
          content.length > maxLength - 2
            ? 8 > maxLength
              ? '{"..."}'
              : "{" + content.slice(0, maxLength - 7) + '..."}'
            : "{" + content + "}")
        : content.length > maxLength
          ? 5 > maxLength
            ? '{"..."}'
            : content.slice(0, maxLength - 3) + "..."
          : content;
    }
    function describeTextDiff(clientText, serverProps, indent) {
      var maxLength = 120 - 2 * indent;
      if (null === serverProps)
        return added(indent) + describeTextNode(clientText, maxLength) + "\n";
      if ("string" === typeof serverProps) {
        for (
          var firstDiff = 0;
          firstDiff < serverProps.length &&
          firstDiff < clientText.length &&
          serverProps.charCodeAt(firstDiff) ===
            clientText.charCodeAt(firstDiff);
          firstDiff++
        );
        firstDiff > maxLength - 8 &&
          10 < firstDiff &&
          ((clientText = "..." + clientText.slice(firstDiff - 8)),
          (serverProps = "..." + serverProps.slice(firstDiff - 8)));
        return (
          added(indent) +
          describeTextNode(clientText, maxLength) +
          "\n" +
          removed(indent) +
          describeTextNode(serverProps, maxLength) +
          "\n"
        );
      }
      return (
        indentation(indent) + describeTextNode(clientText, maxLength) + "\n"
      );
    }
    function objectName(object) {
      return Object.prototype.toString
        .call(object)
        .replace(/^\[object (.*)\]$/, function (m, p0) {
          return p0;
        });
    }
    function describeValue(value, maxLength) {
      switch (typeof value) {
        case "string":
          return (
            (value = JSON.stringify(value)),
            value.length > maxLength
              ? 5 > maxLength
                ? '"..."'
                : value.slice(0, maxLength - 4) + '..."'
              : value
          );
        case "object":
          if (null === value) return "null";
          if (isArrayImpl(value)) return "[...]";
          if (value.$$typeof === REACT_ELEMENT_TYPE)
            return (maxLength = getComponentNameFromType(value.type))
              ? "<" + maxLength + ">"
              : "<...>";
          var name = objectName(value);
          if ("Object" === name) {
            name = "";
            maxLength -= 2;
            for (var propName in value)
              if (value.hasOwnProperty(propName)) {
                var jsonPropName = JSON.stringify(propName);
                jsonPropName !== '"' + propName + '"' &&
                  (propName = jsonPropName);
                maxLength -= propName.length - 2;
                jsonPropName = describeValue(
                  value[propName],
                  15 > maxLength ? maxLength : 15
                );
                maxLength -= jsonPropName.length;
                if (0 > maxLength) {
                  name += "" === name ? "..." : ", ...";
                  break;
                }
                name +=
                  ("" === name ? "" : ",") + propName + ":" + jsonPropName;
              }
            return "{" + name + "}";
          }
          return name;
        case "function":
          return (maxLength = value.displayName || value.name)
            ? "function " + maxLength
            : "function";
        default:
          return String(value);
      }
    }
    function describePropValue(value, maxLength) {
      return "string" !== typeof value || needsEscaping.test(value)
        ? "{" + describeValue(value, maxLength - 2) + "}"
        : value.length > maxLength - 2
          ? 5 > maxLength
            ? '"..."'
            : '"' + value.slice(0, maxLength - 5) + '..."'
          : '"' + value + '"';
    }
    function describeExpandedElement(type, props, rowPrefix) {
      var remainingRowLength = 120 - rowPrefix.length - type.length,
        properties = [],
        propName;
      for (propName in props)
        if (props.hasOwnProperty(propName) && "children" !== propName) {
          var propValue = describePropValue(
            props[propName],
            120 - rowPrefix.length - propName.length - 1
          );
          remainingRowLength -= propName.length + propValue.length + 2;
          properties.push(propName + "=" + propValue);
        }
      return 0 === properties.length
        ? rowPrefix + "<" + type + ">\n"
        : 0 < remainingRowLength
          ? rowPrefix + "<" + type + " " + properties.join(" ") + ">\n"
          : rowPrefix +
            "<" +
            type +
            "\n" +
            rowPrefix +
            "  " +
            properties.join("\n" + rowPrefix + "  ") +
            "\n" +
            rowPrefix +
            ">\n";
    }
    function describePropertiesDiff(clientObject, serverObject, indent) {
      var properties = "",
        remainingServerProperties = assign({}, serverObject),
        propName;
      for (propName in clientObject)
        if (clientObject.hasOwnProperty(propName)) {
          delete remainingServerProperties[propName];
          var maxLength = 120 - 2 * indent - propName.length - 2,
            clientPropValue = describeValue(clientObject[propName], maxLength);
          serverObject.hasOwnProperty(propName)
            ? ((maxLength = describeValue(serverObject[propName], maxLength)),
              (properties +=
                added(indent) + propName + ": " + clientPropValue + "\n"),
              (properties +=
                removed(indent) + propName + ": " + maxLength + "\n"))
            : (properties +=
                added(indent) + propName + ": " + clientPropValue + "\n");
        }
      for (var _propName in remainingServerProperties)
        remainingServerProperties.hasOwnProperty(_propName) &&
          ((clientObject = describeValue(
            remainingServerProperties[_propName],
            120 - 2 * indent - _propName.length - 2
          )),
          (properties +=
            removed(indent) + _propName + ": " + clientObject + "\n"));
      return properties;
    }
    function describeElementDiff(type, clientProps, serverProps, indent) {
      var content = "",
        serverPropNames = new Map();
      for (propName$jscomp$0 in serverProps)
        serverProps.hasOwnProperty(propName$jscomp$0) &&
          serverPropNames.set(
            propName$jscomp$0.toLowerCase(),
            propName$jscomp$0
          );
      if (1 === serverPropNames.size && serverPropNames.has("children"))
        content += describeExpandedElement(
          type,
          clientProps,
          indentation(indent)
        );
      else {
        for (var _propName2 in clientProps)
          if (
            clientProps.hasOwnProperty(_propName2) &&
            "children" !== _propName2
          ) {
            var maxLength$jscomp$0 =
                120 - 2 * (indent + 1) - _propName2.length - 1,
              serverPropName = serverPropNames.get(_propName2.toLowerCase());
            if (void 0 !== serverPropName) {
              serverPropNames.delete(_propName2.toLowerCase());
              var propName$jscomp$0 = clientProps[_propName2];
              serverPropName = serverProps[serverPropName];
              var clientPropValue = describePropValue(
                propName$jscomp$0,
                maxLength$jscomp$0
              );
              maxLength$jscomp$0 = describePropValue(
                serverPropName,
                maxLength$jscomp$0
              );
              "object" === typeof propName$jscomp$0 &&
              null !== propName$jscomp$0 &&
              "object" === typeof serverPropName &&
              null !== serverPropName &&
              "Object" === objectName(propName$jscomp$0) &&
              "Object" === objectName(serverPropName) &&
              (2 < Object.keys(propName$jscomp$0).length ||
                2 < Object.keys(serverPropName).length ||
                -1 < clientPropValue.indexOf("...") ||
                -1 < maxLength$jscomp$0.indexOf("..."))
                ? (content +=
                    indentation(indent + 1) +
                    _propName2 +
                    "={{\n" +
                    describePropertiesDiff(
                      propName$jscomp$0,
                      serverPropName,
                      indent + 2
                    ) +
                    indentation(indent + 1) +
                    "}}\n")
                : ((content +=
                    added(indent + 1) +
                    _propName2 +
                    "=" +
                    clientPropValue +
                    "\n"),
                  (content +=
                    removed(indent + 1) +
                    _propName2 +
                    "=" +
                    maxLength$jscomp$0 +
                    "\n"));
            } else
              content +=
                indentation(indent + 1) +
                _propName2 +
                "=" +
                describePropValue(clientProps[_propName2], maxLength$jscomp$0) +
                "\n";
          }
        serverPropNames.forEach(function (propName) {
          if ("children" !== propName) {
            var maxLength = 120 - 2 * (indent + 1) - propName.length - 1;
            content +=
              removed(indent + 1) +
              propName +
              "=" +
              describePropValue(serverProps[propName], maxLength) +
              "\n";
          }
        });
        content =
          "" === content
            ? indentation(indent) + "<" + type + ">\n"
            : indentation(indent) +
              "<" +
              type +
              "\n" +
              content +
              indentation(indent) +
              ">\n";
      }
      type = serverProps.children;
      clientProps = clientProps.children;
      if (
        "string" === typeof type ||
        "number" === typeof type ||
        "bigint" === typeof type
      ) {
        serverPropNames = "";
        if (
          "string" === typeof clientProps ||
          "number" === typeof clientProps ||
          "bigint" === typeof clientProps
        )
          serverPropNames = "" + clientProps;
        content += describeTextDiff(serverPropNames, "" + type, indent + 1);
      } else if (
        "string" === typeof clientProps ||
        "number" === typeof clientProps ||
        "bigint" === typeof clientProps
      )
        content =
          null == type
            ? content + describeTextDiff("" + clientProps, null, indent + 1)
            : content + describeTextDiff("" + clientProps, void 0, indent + 1);
      return content;
    }
    function describeSiblingFiber(fiber, indent) {
      var type = describeFiberType(fiber);
      if (null === type) {
        type = "";
        for (fiber = fiber.child; fiber; )
          (type += describeSiblingFiber(fiber, indent)),
            (fiber = fiber.sibling);
        return type;
      }
      return indentation(indent) + "<" + type + ">\n";
    }
    function describeNode(node, indent) {
      var skipToNode = findNotableNode(node, indent);
      if (
        skipToNode !== node &&
        (1 !== node.children.length || node.children[0] !== skipToNode)
      )
        return (
          indentation(indent) + "...\n" + describeNode(skipToNode, indent + 1)
        );
      skipToNode = "";
      var debugInfo = node.fiber._debugInfo;
      if (debugInfo)
        for (var i = 0; i < debugInfo.length; i++) {
          var serverComponentName = debugInfo[i].name;
          "string" === typeof serverComponentName &&
            ((skipToNode +=
              indentation(indent) + "<" + serverComponentName + ">\n"),
            indent++);
        }
      debugInfo = "";
      i = node.fiber.pendingProps;
      if (6 === node.fiber.tag)
        (debugInfo = describeTextDiff(i, node.serverProps, indent)), indent++;
      else if (
        ((serverComponentName = describeFiberType(node.fiber)),
        null !== serverComponentName)
      )
        if (void 0 === node.serverProps) {
          debugInfo = indent;
          var maxLength = 120 - 2 * debugInfo - serverComponentName.length - 2,
            content = "";
          for (propName in i)
            if (i.hasOwnProperty(propName) && "children" !== propName) {
              var propValue = describePropValue(i[propName], 15);
              maxLength -= propName.length + propValue.length + 2;
              if (0 > maxLength) {
                content += " ...";
                break;
              }
              content += " " + propName + "=" + propValue;
            }
          debugInfo =
            indentation(debugInfo) +
            "<" +
            serverComponentName +
            content +
            ">\n";
          indent++;
        } else
          null === node.serverProps
            ? ((debugInfo = describeExpandedElement(
                serverComponentName,
                i,
                added(indent)
              )),
              indent++)
            : "string" === typeof node.serverProps
              ? console.error(
                  "Should not have matched a non HostText fiber to a Text node. This is a bug in React."
                )
              : ((debugInfo = describeElementDiff(
                  serverComponentName,
                  i,
                  node.serverProps,
                  indent
                )),
                indent++);
      var propName = "";
      i = node.fiber.child;
      for (
        serverComponentName = 0;
        i && serverComponentName < node.children.length;

      )
        (maxLength = node.children[serverComponentName]),
          maxLength.fiber === i
            ? ((propName += describeNode(maxLength, indent)),
              serverComponentName++)
            : (propName += describeSiblingFiber(i, indent)),
          (i = i.sibling);
      i &&
        0 < node.children.length &&
        (propName += indentation(indent) + "...\n");
      i = node.serverTail;
      null === node.serverProps && indent--;
      for (node = 0; node < i.length; node++)
        (serverComponentName = i[node]),
          (propName =
            "string" === typeof serverComponentName
              ? propName +
                (removed(indent) +
                  describeTextNode(serverComponentName, 120 - 2 * indent) +
                  "\n")
              : propName +
                describeExpandedElement(
                  serverComponentName.type,
                  serverComponentName.props,
                  removed(indent)
                ));
      return skipToNode + debugInfo + propName;
    }
    function describeDiff(rootNode) {
      try {
        return "\n\n" + describeNode(rootNode, 0);
      } catch (x) {
        return "";
      }
    }
    function getCurrentFiberStackInDev() {
      if (null === current) return "";
      var workInProgress = current;
      try {
        var info = "";
        6 === workInProgress.tag && (workInProgress = workInProgress.return);
        switch (workInProgress.tag) {
          case 26:
          case 27:
          case 5:
            info += describeBuiltInComponentFrame(workInProgress.type);
            break;
          case 13:
            info += describeBuiltInComponentFrame("Suspense");
            break;
          case 19:
            info += describeBuiltInComponentFrame("SuspenseList");
            break;
          case 31:
            info += describeBuiltInComponentFrame("Activity");
            break;
          case 30:
            if (enableViewTransition) {
              info += describeBuiltInComponentFrame("ViewTransition");
              break;
            }
          case 0:
          case 15:
          case 1:
            workInProgress._debugOwner ||
              "" !== info ||
              (info += describeFunctionComponentFrameWithoutLineNumber(
                workInProgress.type
              ));
            break;
          case 11:
            workInProgress._debugOwner ||
              "" !== info ||
              (info += describeFunctionComponentFrameWithoutLineNumber(
                workInProgress.type.render
              ));
        }
        for (; workInProgress; )
          if ("number" === typeof workInProgress.tag) {
            var fiber = workInProgress;
            workInProgress = fiber._debugOwner;
            var debugStack = fiber._debugStack;
            if (workInProgress && debugStack) {
              var formattedStack = formatOwnerStack(debugStack);
              "" !== formattedStack && (info += "\n" + formattedStack);
            }
          } else if (null != workInProgress.debugStack) {
            var ownerStack = workInProgress.debugStack;
            (workInProgress = workInProgress.owner) &&
              ownerStack &&
              (info += "\n" + formatOwnerStack(ownerStack));
          } else break;
        var JSCompiler_inline_result = info;
      } catch (x) {
        JSCompiler_inline_result =
          "\nError generating stack: " + x.message + "\n" + x.stack;
      }
      return JSCompiler_inline_result;
    }
    function runWithFiberInDEV(fiber, callback, arg0, arg1, arg2, arg3, arg4) {
      var previousFiber = current;
      setCurrentFiber(fiber);
      try {
        return null !== fiber && fiber._debugTask
          ? fiber._debugTask.run(
              callback.bind(null, arg0, arg1, arg2, arg3, arg4)
            )
          : callback(arg0, arg1, arg2, arg3, arg4);
      } finally {
        setCurrentFiber(previousFiber);
      }
      throw Error(
        "runWithFiberInDEV should never be called in production. This is a bug in React."
      );
    }
    function setCurrentFiber(fiber) {
      ReactSharedInternals.getCurrentStack =
        null === fiber ? null : getCurrentFiberStackInDev;
      isRendering = !1;
      current = fiber;
    }
    function buildHydrationDiffNode(fiber, distanceFromLeaf) {
      if (null === fiber.return) {
        if (null === hydrationDiffRootDEV)
          hydrationDiffRootDEV = {
            fiber: fiber,
            children: [],
            serverProps: void 0,
            serverTail: [],
            distanceFromLeaf: distanceFromLeaf
          };
        else {
          if (hydrationDiffRootDEV.fiber !== fiber)
            throw Error(
              "Saw multiple hydration diff roots in a pass. This is a bug in React."
            );
          hydrationDiffRootDEV.distanceFromLeaf > distanceFromLeaf &&
            (hydrationDiffRootDEV.distanceFromLeaf = distanceFromLeaf);
        }
        return hydrationDiffRootDEV;
      }
      var siblings = buildHydrationDiffNode(
        fiber.return,
        distanceFromLeaf + 1
      ).children;
      if (0 < siblings.length && siblings[siblings.length - 1].fiber === fiber)
        return (
          (siblings = siblings[siblings.length - 1]),
          siblings.distanceFromLeaf > distanceFromLeaf &&
            (siblings.distanceFromLeaf = distanceFromLeaf),
          siblings
        );
      distanceFromLeaf = {
        fiber: fiber,
        children: [],
        serverProps: void 0,
        serverTail: [],
        distanceFromLeaf: distanceFromLeaf
      };
      siblings.push(distanceFromLeaf);
      return distanceFromLeaf;
    }
    function warnIfHydrating() {
      isHydrating &&
        console.error(
          "We should not be hydrating here. This is a bug in React. Please file a bug."
        );
    }
    function warnNonHydratedInstance(fiber, rejectedCandidate) {
      didSuspendOrErrorDEV ||
        ((fiber = buildHydrationDiffNode(fiber, 0)),
        (fiber.serverProps = null),
        null !== rejectedCandidate &&
          ((rejectedCandidate =
            describeHydratableInstanceForDevWarnings(rejectedCandidate)),
          fiber.serverTail.push(rejectedCandidate)));
    }
    function throwOnHydrationMismatch(fiber) {
      var fromText =
          1 < arguments.length && void 0 !== arguments[1] ? arguments[1] : !1,
        diff = "",
        diffRoot = hydrationDiffRootDEV;
      null !== diffRoot &&
        ((hydrationDiffRootDEV = null), (diff = describeDiff(diffRoot)));
      queueHydrationError(
        createCapturedValueAtFiber(
          Error(
            "Hydration failed because the server rendered " +
              (fromText ? "text" : "HTML") +
              " didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used:\n\n- A server/client branch `if (typeof window !== 'undefined')`.\n- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.\n- Date formatting in a user's locale which doesn't match the server.\n- External changing data without sending a snapshot of it along with the HTML.\n- Invalid HTML tag nesting.\n\nIt can also happen if the client has a browser extension installed which messes with the HTML before React loaded.\n\nhttps://react.dev/link/hydration-mismatch" +
              diff
          ),
          fiber
        )
      );
      throw HydrationMismatchException;
    }
    function prepareToHydrateHostInstance(fiber, hostContext) {
      if (!supportsHydration)
        throw Error(
          "Expected prepareToHydrateHostInstance() to never be called. This error is likely caused by a bug in React. Please file an issue."
        );
      hydrateInstance(
        fiber.stateNode,
        fiber.type,
        fiber.memoizedProps,
        hostContext,
        fiber
      ) || throwOnHydrationMismatch(fiber, !0);
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
      if (!supportsHydration || fiber !== hydrationParentFiber) return !1;
      if (!isHydrating)
        return popToNextHostParent(fiber), (isHydrating = !0), !1;
      var tag = fiber.tag;
      supportsSingletons
        ? 3 !== tag &&
          27 !== tag &&
          (5 !== tag ||
            (shouldDeleteUnhydratedTailInstances(fiber.type) &&
              !shouldSetTextContent(fiber.type, fiber.memoizedProps))) &&
          nextHydratableInstance &&
          (warnIfUnhydratedTailNodes(fiber), throwOnHydrationMismatch(fiber))
        : 3 !== tag &&
          (5 !== tag ||
            (shouldDeleteUnhydratedTailInstances(fiber.type) &&
              !shouldSetTextContent(fiber.type, fiber.memoizedProps))) &&
          nextHydratableInstance &&
          (warnIfUnhydratedTailNodes(fiber), throwOnHydrationMismatch(fiber));
      popToNextHostParent(fiber);
      if (13 === tag) {
        if (!supportsHydration)
          throw Error(
            "Expected skipPastDehydratedSuspenseInstance() to never be called. This error is likely caused by a bug in React. Please file an issue."
          );
        fiber = fiber.memoizedState;
        fiber = null !== fiber ? fiber.dehydrated : null;
        if (!fiber)
          throw Error(
            "Expected to have a hydrated suspense instance. This error is likely caused by a bug in React. Please file an issue."
          );
        nextHydratableInstance =
          getNextHydratableInstanceAfterSuspenseInstance(fiber);
      } else if (31 === tag) {
        fiber = fiber.memoizedState;
        fiber = null !== fiber ? fiber.dehydrated : null;
        if (!fiber)
          throw Error(
            "Expected to have a hydrated suspense instance. This error is likely caused by a bug in React. Please file an issue."
          );
        nextHydratableInstance =
          getNextHydratableInstanceAfterActivityInstance(fiber);
      } else
        nextHydratableInstance =
          supportsSingletons && 27 === tag
            ? getNextHydratableSiblingAfterSingleton(
                fiber.type,
                nextHydratableInstance
              )
            : hydrationParentFiber
              ? getNextHydratableSibling(fiber.stateNode)
              : null;
      return !0;
    }
    function warnIfUnhydratedTailNodes(fiber) {
      for (var nextInstance = nextHydratableInstance; nextInstance; ) {
        var diffNode = buildHydrationDiffNode(fiber, 0),
          description = describeHydratableInstanceForDevWarnings(nextInstance);
        diffNode.serverTail.push(description);
        nextInstance =
          "Suspense" === description.type
            ? getNextHydratableInstanceAfterSuspenseInstance(nextInstance)
            : getNextHydratableSibling(nextInstance);
      }
    }
    function resetHydrationState() {
      supportsHydration &&
        ((nextHydratableInstance = hydrationParentFiber = null),
        (didSuspendOrErrorDEV = isHydrating = !1));
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
    function emitPendingHydrationWarnings() {
      var diffRoot = hydrationDiffRootDEV;
      if (null !== diffRoot) {
        hydrationDiffRootDEV = null;
        for (var diff = describeDiff(diffRoot); 0 < diffRoot.children.length; )
          diffRoot = diffRoot.children[0];
        runWithFiberInDEV(diffRoot.fiber, function () {
          console.error(
            "A tree hydrated but some attributes of the server rendered HTML didn't match the client properties. This won't be patched up. This can happen if a SSR-ed Client Component used:\n\n- A server/client branch `if (typeof window !== 'undefined')`.\n- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.\n- Date formatting in a user's locale which doesn't match the server.\n- External changing data without sending a snapshot of it along with the HTML.\n- Invalid HTML tag nesting.\n\nIt can also happen if the client has a browser extension installed which messes with the HTML before React loaded.\n\n%s%s",
            "https://react.dev/link/hydration-mismatch",
            diff
          );
        });
      }
    }
    function resetContextDependencies() {
      lastContextDependency = currentlyRenderingFiber$1 = null;
      isDisallowedContextReadInDEV = !1;
    }
    function pushProvider(providerFiber, context, nextValue) {
      isPrimaryRenderer
        ? (push(valueCursor, context._currentValue, providerFiber),
          (context._currentValue = nextValue),
          push(rendererCursorDEV, context._currentRenderer, providerFiber),
          void 0 !== context._currentRenderer &&
            null !== context._currentRenderer &&
            context._currentRenderer !== rendererSigil &&
            console.error(
              "Detected multiple renderers concurrently rendering the same context provider. This is currently unsupported."
            ),
          (context._currentRenderer = rendererSigil))
        : (push(valueCursor, context._currentValue2, providerFiber),
          (context._currentValue2 = nextValue),
          push(renderer2CursorDEV, context._currentRenderer2, providerFiber),
          void 0 !== context._currentRenderer2 &&
            null !== context._currentRenderer2 &&
            context._currentRenderer2 !== rendererSigil &&
            console.error(
              "Detected multiple renderers concurrently rendering the same context provider. This is currently unsupported."
            ),
          (context._currentRenderer2 = rendererSigil));
    }
    function popProvider(context, providerFiber) {
      var currentValue = valueCursor.current;
      isPrimaryRenderer
        ? ((context._currentValue = currentValue),
          (currentValue = rendererCursorDEV.current),
          pop(rendererCursorDEV, providerFiber),
          (context._currentRenderer = currentValue))
        : ((context._currentValue2 = currentValue),
          (currentValue = renderer2CursorDEV.current),
          pop(renderer2CursorDEV, providerFiber),
          (context._currentRenderer2 = currentValue));
      pop(valueCursor, providerFiber);
    }
    function scheduleContextWorkOnParentPath(
      parent,
      renderLanes,
      propagationRoot
    ) {
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
      parent !== propagationRoot &&
        console.error(
          "Expected to find the propagation root when scheduling context work. This error is likely caused by a bug in React. Please file an issue."
        );
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
          if (null === nextFiber)
            throw Error(
              "We just came from a parent so we must have had a parent. This is a bug in React."
            );
          nextFiber.lanes |= renderLanes;
          list = nextFiber.alternate;
          null !== list && (list.lanes |= renderLanes);
          scheduleContextWorkOnParentPath(
            nextFiber,
            renderLanes,
            workInProgress
          );
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
          if (null === currentParent)
            throw Error("Should have a current fiber. This is a bug in React.");
          currentParent = currentParent.memoizedProps;
          if (null !== currentParent) {
            var context = parent.type;
            objectIs(parent.pendingProps.value, currentParent.value) ||
              (null !== current
                ? current.push(context)
                : (current = [context]));
          }
        } else if (parent === hostTransitionProviderCursor.current) {
          currentParent = parent.alternate;
          if (null === currentParent)
            throw Error("Should have a current fiber. This is a bug in React.");
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
        var context = currentDependencies.context;
        if (
          !objectIs(
            isPrimaryRenderer ? context._currentValue : context._currentValue2,
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
      isDisallowedContextReadInDEV &&
        console.error(
          "Context can only be read while React is rendering. In classes, you can read it in the render method or getDerivedStateFromProps. In function components, you can read it directly in the function body, but not inside Hooks like useReducer() or useMemo()."
        );
      return readContextForConsumer(currentlyRenderingFiber$1, context);
    }
    function readContextDuringReconciliation(consumer, context) {
      null === currentlyRenderingFiber$1 && prepareToReadContext(consumer);
      return readContextForConsumer(consumer, context);
    }
    function readContextForConsumer(consumer, context) {
      var value = isPrimaryRenderer
        ? context._currentValue
        : context._currentValue2;
      context = { context: context, memoizedValue: value, next: null };
      if (null === lastContextDependency) {
        if (null === consumer)
          throw Error(
            "Context can only be read while React is rendering. In classes, you can read it in the render method or getDerivedStateFromProps. In function components, you can read it directly in the function body, but not inside Hooks like useReducer() or useMemo()."
          );
        lastContextDependency = context;
        consumer.dependencies = {
          lanes: 0,
          firstContext: context,
          _debugThenableState: null
        };
        consumer.flags |= 524288;
      } else lastContextDependency = lastContextDependency.next = context;
      return value;
    }
    function createCache() {
      return {
        controller: new AbortControllerLocal(),
        data: new Map(),
        refCount: 0
      };
    }
    function retainCache(cache) {
      cache.controller.signal.aborted &&
        console.warn(
          "A cache instance was retained after it was already freed. This likely indicates a bug in React."
        );
      cache.refCount++;
    }
    function releaseCache(cache) {
      cache.refCount--;
      0 > cache.refCount &&
        console.warn(
          "A cache instance was released after it was already freed. This likely indicates a bug in React."
        );
      0 === cache.refCount &&
        scheduleCallback$2(NormalPriority, function () {
          cache.controller.abort();
        });
    }
    function queueTransitionTypes(root, transitionTypes) {
      if (enableViewTransition && 0 !== (root.pendingLanes & 4194048)) {
        var queued = root.transitionTypes;
        null === queued && (queued = root.transitionTypes = []);
        for (root = 0; root < transitionTypes.length; root++) {
          var transitionType = transitionTypes[root];
          -1 === queued.indexOf(transitionType) && queued.push(transitionType);
        }
      }
    }
    function claimQueuedTransitionTypes(root) {
      var claimed = root.transitionTypes;
      root.transitionTypes = null;
      return claimed;
    }
    function startUpdateTimerByLane(lane, method, fiber) {
      if (enableComponentPerformanceTrack)
        if (0 !== (lane & 127))
          0 > blockingUpdateTime &&
            ((blockingUpdateTime = now()),
            (blockingUpdateTask = createTask(method)),
            (blockingUpdateMethodName = method),
            null != fiber &&
              (blockingUpdateComponentName = getComponentNameFromFiber(fiber)),
            isAlreadyRendering() &&
              ((componentEffectSpawnedUpdate = !0), (blockingUpdateType = 1)),
            (lane = resolveEventTimeStamp()),
            (method = resolveEventType()),
            lane !== blockingEventRepeatTime || method !== blockingEventType
              ? (blockingEventRepeatTime = -1.1)
              : null !== method && (blockingUpdateType = 1),
            (blockingEventTime = lane),
            (blockingEventType = method));
        else if (
          0 !== (lane & 4194048) &&
          0 > transitionUpdateTime &&
          ((transitionUpdateTime = now()),
          (transitionUpdateTask = createTask(method)),
          (transitionUpdateMethodName = method),
          null != fiber &&
            (transitionUpdateComponentName = getComponentNameFromFiber(fiber)),
          0 > transitionStartTime)
        ) {
          lane = resolveEventTimeStamp();
          method = resolveEventType();
          if (
            lane !== transitionEventRepeatTime ||
            method !== transitionEventType
          )
            transitionEventRepeatTime = -1.1;
          transitionEventTime = lane;
          transitionEventType = method;
        }
    }
    function startHostActionTimer(fiber) {
      if (enableComponentPerformanceTrack) {
        if (0 > blockingUpdateTime) {
          blockingUpdateTime = now();
          blockingUpdateTask =
            null != fiber._debugTask ? fiber._debugTask : null;
          isAlreadyRendering() && (blockingUpdateType = 1);
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
          ((transitionUpdateTime = now()),
          (transitionUpdateTask =
            null != fiber._debugTask ? fiber._debugTask : null),
          0 > transitionStartTime)
        ) {
          fiber = resolveEventTimeStamp();
          newEventTime = resolveEventType();
          if (
            fiber !== transitionEventRepeatTime ||
            newEventTime !== transitionEventType
          )
            transitionEventRepeatTime = -1.1;
          transitionEventTime = fiber;
          transitionEventType = newEventTime;
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
    function noop$1() {}
    function ensureRootIsScheduled(root) {
      root !== lastScheduledRoot &&
        null === root.next &&
        (null === lastScheduledRoot
          ? (firstScheduledRoot = lastScheduledRoot = root)
          : (lastScheduledRoot = lastScheduledRoot.next = root));
      mightHavePendingSyncWork = !0;
      ensureScheduleIsScheduled();
    }
    function ensureScheduleIsScheduled() {
      null !== ReactSharedInternals.actQueue
        ? didScheduleMicrotask_act ||
          ((didScheduleMicrotask_act = !0), scheduleImmediateRootScheduleTask())
        : didScheduleMicrotask ||
          ((didScheduleMicrotask = !0), scheduleImmediateRootScheduleTask());
    }
    function flushSyncWorkAcrossRoots_impl(syncTransitionLanes, onlyLegacy) {
      if (!isFlushingWork && mightHavePendingSyncWork) {
        isFlushingWork = !0;
        do {
          var didPerformSomeWork = !1;
          for (var root = firstScheduledRoot; null !== root; ) {
            if (!onlyLegacy)
              if (0 !== syncTransitionLanes) {
                var pendingLanes = root.pendingLanes;
                if (0 === pendingLanes) var nextLanes = 0;
                else {
                  var suspendedLanes = root.suspendedLanes,
                    pingedLanes = root.pingedLanes;
                  nextLanes =
                    (1 << (31 - clz32(42 | syncTransitionLanes) + 1)) - 1;
                  nextLanes &= pendingLanes & ~(suspendedLanes & ~pingedLanes);
                  nextLanes =
                    nextLanes & 201326741
                      ? (nextLanes & 201326741) | 1
                      : nextLanes
                        ? nextLanes | 2
                        : 0;
                }
                0 !== nextLanes &&
                  ((didPerformSomeWork = !0),
                  performSyncWorkOnRoot(root, nextLanes));
              } else
                (nextLanes = workInProgressRootRenderLanes),
                  (nextLanes = getNextLanes(
                    root,
                    root === workInProgressRoot ? nextLanes : 0,
                    null !== root.cancelPendingCommit ||
                      root.timeoutHandle !== noTimeout
                  )),
                  0 === (nextLanes & 3) ||
                    checkIfRootIsPrerendering(root, nextLanes) ||
                    ((didPerformSomeWork = !0),
                    performSyncWorkOnRoot(root, nextLanes));
            root = root.next;
          }
        } while (didPerformSomeWork);
        isFlushingWork = !1;
      }
    }
    function processRootScheduleInImmediateTask() {
      enableComponentPerformanceTrack && trackSchedulerEvent();
      processRootScheduleInMicrotask();
    }
    function processRootScheduleInMicrotask() {
      mightHavePendingSyncWork =
        didScheduleMicrotask_act =
        didScheduleMicrotask =
          !1;
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
      (pendingEffectsStatus !== NO_PENDING_EFFECTS &&
        pendingEffectsStatus !== PENDING_PASSIVE_PHASE) ||
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
      var pendingLanes = root.pendingLanes,
        suspendedLanes = root.suspendedLanes,
        pingedLanes = root.pingedLanes,
        expirationTimes = root.expirationTimes;
      for (
        pendingLanes = enableRetryLaneExpiration
          ? pendingLanes
          : pendingLanes & -62914561;
        0 < pendingLanes;

      ) {
        var index = 31 - clz32(pendingLanes),
          lane = 1 << index,
          expirationTime = expirationTimes[index];
        if (-1 === expirationTime) {
          if (0 === (lane & suspendedLanes) || 0 !== (lane & pingedLanes))
            expirationTimes[index] = computeExpirationTime(lane, currentTime);
        } else expirationTime <= currentTime && (root.expiredLanes |= lane);
        pendingLanes &= ~lane;
      }
      currentTime = workInProgressRoot;
      suspendedLanes = workInProgressRootRenderLanes;
      suspendedLanes = getNextLanes(
        root,
        root === currentTime ? suspendedLanes : 0,
        null !== root.cancelPendingCommit || root.timeoutHandle !== noTimeout
      );
      pingedLanes = root.callbackNode;
      if (
        0 === suspendedLanes ||
        (root === currentTime &&
          (workInProgressSuspendedReason === SuspendedOnData ||
            workInProgressSuspendedReason === SuspendedOnAction)) ||
        null !== root.cancelPendingCommit
      )
        return (
          null !== pingedLanes && cancelCallback(pingedLanes),
          (root.callbackNode = null),
          (root.callbackPriority = 0)
        );
      if (
        0 === (suspendedLanes & 3) ||
        checkIfRootIsPrerendering(root, suspendedLanes)
      ) {
        currentTime = suspendedLanes & -suspendedLanes;
        if (
          currentTime !== root.callbackPriority ||
          (null !== ReactSharedInternals.actQueue &&
            pingedLanes !== fakeActCallbackNode$1)
        )
          cancelCallback(pingedLanes);
        else return currentTime;
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
        null !== ReactSharedInternals.actQueue
          ? (ReactSharedInternals.actQueue.push(pingedLanes),
            (suspendedLanes = fakeActCallbackNode$1))
          : (suspendedLanes = scheduleCallback$3(suspendedLanes, pingedLanes));
        root.callbackPriority = currentTime;
        root.callbackNode = suspendedLanes;
        return currentTime;
      }
      null !== pingedLanes && cancelCallback(pingedLanes);
      root.callbackPriority = 2;
      root.callbackNode = null;
      return 2;
    }
    function performWorkOnRootViaSchedulerTask(root, didTimeout) {
      nestedUpdateScheduled = currentUpdateIsNested = !1;
      enableComponentPerformanceTrack && trackSchedulerEvent();
      if (
        pendingEffectsStatus !== NO_PENDING_EFFECTS &&
        pendingEffectsStatus !== PENDING_PASSIVE_PHASE
      )
        return (root.callbackNode = null), (root.callbackPriority = 0), null;
      var originalCallbackNode = root.callbackNode;
      pendingDelayedCommitReason === IMMEDIATE_COMMIT &&
        (pendingDelayedCommitReason = DELAYED_PASSIVE_COMMIT);
      if (flushPendingEffects() && root.callbackNode !== originalCallbackNode)
        return null;
      var workInProgressRootRenderLanes$jscomp$0 =
        workInProgressRootRenderLanes;
      workInProgressRootRenderLanes$jscomp$0 = getNextLanes(
        root,
        root === workInProgressRoot
          ? workInProgressRootRenderLanes$jscomp$0
          : 0,
        null !== root.cancelPendingCommit || root.timeoutHandle !== noTimeout
      );
      if (0 === workInProgressRootRenderLanes$jscomp$0) return null;
      performWorkOnRoot(
        root,
        workInProgressRootRenderLanes$jscomp$0,
        !disableSchedulerTimeoutInWorkLoop && didTimeout
      );
      scheduleTaskForRootDuringMicrotask(root, now$1());
      return null != root.callbackNode &&
        root.callbackNode === originalCallbackNode
        ? performWorkOnRootViaSchedulerTask.bind(null, root)
        : null;
    }
    function performSyncWorkOnRoot(root, lanes) {
      if (flushPendingEffects()) return null;
      currentUpdateIsNested = nestedUpdateScheduled;
      nestedUpdateScheduled = !1;
      performWorkOnRoot(root, lanes, !0);
    }
    function cancelCallback(callbackNode) {
      callbackNode !== fakeActCallbackNode$1 &&
        null !== callbackNode &&
        cancelCallback$1(callbackNode);
    }
    function scheduleImmediateRootScheduleTask() {
      null !== ReactSharedInternals.actQueue &&
        ReactSharedInternals.actQueue.push(function () {
          processRootScheduleInMicrotask();
          return null;
        });
      supportsMicrotasks
        ? scheduleMicrotask(function () {
            (executionContext & (RenderContext | CommitContext)) !== NoContext
              ? scheduleCallback$3(
                  ImmediatePriority,
                  processRootScheduleInImmediateTask
                )
              : processRootScheduleInMicrotask();
          })
        : scheduleCallback$3(
            ImmediatePriority,
            processRootScheduleInImmediateTask
          );
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
        ensureScheduleIsScheduled();
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
        (entangledTransitionTypes = null),
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
        : isomorphicDefaultTransitionIndicator !==
            onDefaultTransitionIndicator &&
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
        ? push(resumedCache, resumedCache.current, offscreenWorkInProgress)
        : push(resumedCache, prevCachePool.pool, offscreenWorkInProgress);
      enableTransitionTracing &&
        (null === transitionStack.current
          ? push(transitionStack, newTransitions, offscreenWorkInProgress)
          : null === newTransitions
            ? push(
                transitionStack,
                transitionStack.current,
                offscreenWorkInProgress
              )
            : push(
                transitionStack,
                transitionStack.current.concat(newTransitions),
                offscreenWorkInProgress
              ));
    }
    function popTransition(workInProgress, current) {
      null !== current &&
        (enableTransitionTracing && pop(transitionStack, workInProgress),
        pop(resumedCache, workInProgress));
    }
    function getSuspendedCache() {
      var cacheFromPool = peekCacheFromPool();
      return null === cacheFromPool
        ? null
        : {
            parent: isPrimaryRenderer
              ? CacheContext._currentValue
              : CacheContext._currentValue2,
            pool: cacheFromPool
          };
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
    function createThenableState() {
      return { didWarnAboutUncachedPromise: !1, thenables: [] };
    }
    function isThenableResolved(thenable) {
      thenable = thenable.status;
      return "fulfilled" === thenable || "rejected" === thenable;
    }
    function trackUsedThenable(thenableState, thenable, index) {
      null !== ReactSharedInternals.actQueue &&
        (ReactSharedInternals.didUsePromise = !0);
      var trackedThenables = thenableState.thenables;
      index = trackedThenables[index];
      void 0 === index
        ? trackedThenables.push(thenable)
        : index !== thenable &&
          (thenableState.didWarnAboutUncachedPromise ||
            ((thenableState.didWarnAboutUncachedPromise = !0),
            console.error(
              "A component was suspended by an uncached promise. Creating promises inside a Client Component or hook is not yet supported, except via a Suspense-compatible library or framework."
            )),
          thenable.then(noop$1, noop$1),
          (thenable = index));
      if (enableAsyncDebugInfo && void 0 === thenable._debugInfo) {
        thenableState = performance.now();
        trackedThenables = thenable.displayName;
        var ioInfo = {
          name:
            "string" === typeof trackedThenables ? trackedThenables : "Promise",
          start: thenableState,
          end: thenableState,
          value: thenable
        };
        thenable._debugInfo = [{ awaited: ioInfo }];
        "fulfilled" !== thenable.status &&
          "rejected" !== thenable.status &&
          ((thenableState = function () {
            ioInfo.end = performance.now();
          }),
          thenable.then(thenableState, thenableState));
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
        default:
          if ("string" === typeof thenable.status)
            thenable.then(noop$1, noop$1);
          else {
            thenableState = workInProgressRoot;
            if (
              null !== thenableState &&
              100 < thenableState.shellSuspendCounter
            )
              throw Error(
                "An unknown Component is an async Client Component. Only Server Components can be async at the moment. This error is often caused by accidentally adding `'use client'` to a module that was originally written for the server."
              );
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
          needsToResetSuspendedThenableDEV = !0;
          throw SuspenseException;
      }
    }
    function resolveLazy(lazyType) {
      try {
        return callLazyInitInDEV(lazyType);
      } catch (x) {
        if (null !== x && "object" === typeof x && "function" === typeof x.then)
          throw (
            ((suspendedThenable = x),
            (needsToResetSuspendedThenableDEV = !0),
            SuspenseException)
          );
        throw x;
      }
    }
    function getSuspendedThenable() {
      if (null === suspendedThenable)
        throw Error(
          "Expected a suspended thenable. This is a bug in React. Please file an issue."
        );
      var thenable = suspendedThenable;
      suspendedThenable = null;
      needsToResetSuspendedThenableDEV = !1;
      return thenable;
    }
    function checkIfUseWrappedInAsyncCatch(rejectedReason) {
      if (
        rejectedReason === SuspenseException ||
        rejectedReason === SuspenseActionException
      )
        throw Error(
          "Hooks are not supported inside an async component. This error is often caused by accidentally adding `'use client'` to a module that was originally written for the server."
        );
    }
    function pushDebugInfo(debugInfo) {
      var previousDebugInfo = currentDebugInfo;
      null != debugInfo &&
        (currentDebugInfo =
          null === previousDebugInfo
            ? debugInfo
            : previousDebugInfo.concat(debugInfo));
      return previousDebugInfo;
    }
    function getCurrentDebugTask() {
      var debugInfo = currentDebugInfo;
      if (null != debugInfo)
        for (var i = debugInfo.length - 1; 0 <= i; i--)
          if (null != debugInfo[i].name) {
            var debugTask = debugInfo[i].debugTask;
            if (null != debugTask) return debugTask;
          }
      return null;
    }
    function validateFragmentProps(element, fiber, returnFiber) {
      for (var keys = Object.keys(element.props), i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (
          "children" !== key &&
          "key" !== key &&
          (enableFragmentRefs ? "ref" !== key : 1)
        ) {
          null === fiber &&
            ((fiber = createFiberFromElement(element, returnFiber.mode, 0)),
            (fiber._debugInfo = currentDebugInfo),
            (fiber.return = returnFiber));
          runWithFiberInDEV(
            fiber,
            function (erroredKey) {
              enableFragmentRefs
                ? console.error(
                    "Invalid prop `%s` supplied to `React.Fragment`. React.Fragment can only have `key`, `ref`, and `children` props.",
                    erroredKey
                  )
                : console.error(
                    "Invalid prop `%s` supplied to `React.Fragment`. React.Fragment can only have `key` and `children` props.",
                    erroredKey
                  );
            },
            key
          );
          break;
        }
      }
    }
    function unwrapThenable(thenable) {
      var index = thenableIndexCounter$1;
      thenableIndexCounter$1 += 1;
      null === thenableState$1 && (thenableState$1 = createThenableState());
      return trackUsedThenable(thenableState$1, thenable, index);
    }
    function coerceRef(workInProgress, element) {
      element = element.props.ref;
      workInProgress.ref = void 0 !== element ? element : null;
    }
    function throwOnInvalidObjectTypeImpl(returnFiber, newChild) {
      if (newChild.$$typeof === REACT_LEGACY_ELEMENT_TYPE)
        throw Error(
          'A React Element from an older version of React was rendered. This is not supported. It can happen if:\n- Multiple copies of the "react" package is used.\n- A library pre-bundled an old copy of "react" or "react/jsx-runtime".\n- A compiler tries to "inline" JSX instead of using the runtime.'
        );
      returnFiber = Object.prototype.toString.call(newChild);
      throw Error(
        "Objects are not valid as a React child (found: " +
          ("[object Object]" === returnFiber
            ? "object with keys {" + Object.keys(newChild).join(", ") + "}"
            : returnFiber) +
          "). If you meant to render a collection of children, use an array instead."
      );
    }
    function throwOnInvalidObjectType(returnFiber, newChild) {
      var debugTask = getCurrentDebugTask();
      null !== debugTask
        ? debugTask.run(
            throwOnInvalidObjectTypeImpl.bind(null, returnFiber, newChild)
          )
        : throwOnInvalidObjectTypeImpl(returnFiber, newChild);
    }
    function warnOnFunctionTypeImpl(returnFiber, invalidChild) {
      var parentName = getComponentNameFromFiber(returnFiber) || "Component";
      ownerHasFunctionTypeWarning[parentName] ||
        ((ownerHasFunctionTypeWarning[parentName] = !0),
        (invalidChild =
          invalidChild.displayName || invalidChild.name || "Component"),
        3 === returnFiber.tag
          ? console.error(
              "Functions are not valid as a React child. This may happen if you return %s instead of <%s /> from render. Or maybe you meant to call this function rather than return it.\n  root.render(%s)",
              invalidChild,
              invalidChild,
              invalidChild
            )
          : console.error(
              "Functions are not valid as a React child. This may happen if you return %s instead of <%s /> from render. Or maybe you meant to call this function rather than return it.\n  <%s>{%s}</%s>",
              invalidChild,
              invalidChild,
              parentName,
              invalidChild,
              parentName
            ));
    }
    function warnOnFunctionType(returnFiber, invalidChild) {
      var debugTask = getCurrentDebugTask();
      null !== debugTask
        ? debugTask.run(
            warnOnFunctionTypeImpl.bind(null, returnFiber, invalidChild)
          )
        : warnOnFunctionTypeImpl(returnFiber, invalidChild);
    }
    function warnOnSymbolTypeImpl(returnFiber, invalidChild) {
      var parentName = getComponentNameFromFiber(returnFiber) || "Component";
      ownerHasSymbolTypeWarning[parentName] ||
        ((ownerHasSymbolTypeWarning[parentName] = !0),
        (invalidChild = String(invalidChild)),
        3 === returnFiber.tag
          ? console.error(
              "Symbols are not valid as a React child.\n  root.render(%s)",
              invalidChild
            )
          : console.error(
              "Symbols are not valid as a React child.\n  <%s>%s</%s>",
              parentName,
              invalidChild,
              parentName
            ));
    }
    function warnOnSymbolType(returnFiber, invalidChild) {
      var debugTask = getCurrentDebugTask();
      null !== debugTask
        ? debugTask.run(
            warnOnSymbolTypeImpl.bind(null, returnFiber, invalidChild)
          )
        : warnOnSymbolTypeImpl(returnFiber, invalidChild);
    }
    function createChildReconciler(shouldTrackSideEffects) {
      function deleteChild(returnFiber, childToDelete) {
        if (shouldTrackSideEffects) {
          var deletions = returnFiber.deletions;
          null === deletions
            ? ((returnFiber.deletions = [childToDelete]),
              (returnFiber.flags |= 16))
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
            (current = createFiberFromText(
              textContent,
              returnFiber.mode,
              lanes
            )),
            (current.return = returnFiber),
            (current._debugOwner = returnFiber),
            (current._debugTask = returnFiber._debugTask),
            (current._debugInfo = currentDebugInfo),
            current
          );
        current = useFiber(current, textContent);
        current.return = returnFiber;
        current._debugInfo = currentDebugInfo;
        return current;
      }
      function updateElement(returnFiber, current, element, lanes) {
        var elementType = element.type;
        if (elementType === REACT_FRAGMENT_TYPE)
          return (
            (current = updateFragment(
              returnFiber,
              current,
              element.props.children,
              lanes,
              element.key
            )),
            enableFragmentRefs && coerceRef(current, element),
            validateFragmentProps(element, current, returnFiber),
            current
          );
        if (
          null !== current &&
          (current.elementType === elementType ||
            isCompatibleFamilyForHotReloading(current, element) ||
            ("object" === typeof elementType &&
              null !== elementType &&
              elementType.$$typeof === REACT_LAZY_TYPE &&
              resolveLazy(elementType) === current.type))
        )
          return (
            (current = useFiber(current, element.props)),
            coerceRef(current, element),
            (current.return = returnFiber),
            (current._debugOwner = element._owner),
            (current._debugInfo = currentDebugInfo),
            current
          );
        current = createFiberFromElement(element, returnFiber.mode, lanes);
        coerceRef(current, element);
        current.return = returnFiber;
        current._debugInfo = currentDebugInfo;
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
            (current._debugInfo = currentDebugInfo),
            current
          );
        current = useFiber(current, portal.children || []);
        current.return = returnFiber;
        current._debugInfo = currentDebugInfo;
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
            (current._debugOwner = returnFiber),
            (current._debugTask = returnFiber._debugTask),
            (current._debugInfo = currentDebugInfo),
            current
          );
        current = useFiber(current, fragment);
        current.return = returnFiber;
        current._debugInfo = currentDebugInfo;
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
            (newChild._debugOwner = returnFiber),
            (newChild._debugTask = returnFiber._debugTask),
            (newChild._debugInfo = currentDebugInfo),
            newChild
          );
        if ("object" === typeof newChild && null !== newChild) {
          switch (newChild.$$typeof) {
            case REACT_ELEMENT_TYPE:
              return (
                (lanes = createFiberFromElement(
                  newChild,
                  returnFiber.mode,
                  lanes
                )),
                coerceRef(lanes, newChild),
                (lanes.return = returnFiber),
                (returnFiber = pushDebugInfo(newChild._debugInfo)),
                (lanes._debugInfo = currentDebugInfo),
                (currentDebugInfo = returnFiber),
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
                (newChild._debugInfo = currentDebugInfo),
                newChild
              );
            case REACT_LAZY_TYPE:
              var _prevDebugInfo = pushDebugInfo(newChild._debugInfo);
              newChild = resolveLazy(newChild);
              returnFiber = createChild(returnFiber, newChild, lanes);
              currentDebugInfo = _prevDebugInfo;
              return returnFiber;
          }
          if (isArrayImpl(newChild) || getIteratorFn(newChild))
            return (
              (lanes = createFiberFromFragment(
                newChild,
                returnFiber.mode,
                lanes,
                null
              )),
              (lanes.return = returnFiber),
              (lanes._debugOwner = returnFiber),
              (lanes._debugTask = returnFiber._debugTask),
              (returnFiber = pushDebugInfo(newChild._debugInfo)),
              (lanes._debugInfo = currentDebugInfo),
              (currentDebugInfo = returnFiber),
              lanes
            );
          if ("function" === typeof newChild.then)
            return (
              (_prevDebugInfo = pushDebugInfo(newChild._debugInfo)),
              (returnFiber = createChild(
                returnFiber,
                unwrapThenable(newChild),
                lanes
              )),
              (currentDebugInfo = _prevDebugInfo),
              returnFiber
            );
          if (newChild.$$typeof === REACT_CONTEXT_TYPE)
            return createChild(
              returnFiber,
              readContextDuringReconciliation(returnFiber, newChild),
              lanes
            );
          throwOnInvalidObjectType(returnFiber, newChild);
        }
        "function" === typeof newChild &&
          warnOnFunctionType(returnFiber, newChild);
        "symbol" === typeof newChild && warnOnSymbolType(returnFiber, newChild);
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
                ? ((key = pushDebugInfo(newChild._debugInfo)),
                  (returnFiber = updateElement(
                    returnFiber,
                    oldFiber,
                    newChild,
                    lanes
                  )),
                  (currentDebugInfo = key),
                  returnFiber)
                : null;
            case REACT_PORTAL_TYPE:
              return newChild.key === key
                ? updatePortal(returnFiber, oldFiber, newChild, lanes)
                : null;
            case REACT_LAZY_TYPE:
              return (
                (key = pushDebugInfo(newChild._debugInfo)),
                (newChild = resolveLazy(newChild)),
                (returnFiber = updateSlot(
                  returnFiber,
                  oldFiber,
                  newChild,
                  lanes
                )),
                (currentDebugInfo = key),
                returnFiber
              );
          }
          if (isArrayImpl(newChild) || getIteratorFn(newChild)) {
            if (null !== key) return null;
            key = pushDebugInfo(newChild._debugInfo);
            returnFiber = updateFragment(
              returnFiber,
              oldFiber,
              newChild,
              lanes,
              null
            );
            currentDebugInfo = key;
            return returnFiber;
          }
          if ("function" === typeof newChild.then)
            return (
              (key = pushDebugInfo(newChild._debugInfo)),
              (returnFiber = updateSlot(
                returnFiber,
                oldFiber,
                unwrapThenable(newChild),
                lanes
              )),
              (currentDebugInfo = key),
              returnFiber
            );
          if (newChild.$$typeof === REACT_CONTEXT_TYPE)
            return updateSlot(
              returnFiber,
              oldFiber,
              readContextDuringReconciliation(returnFiber, newChild),
              lanes
            );
          throwOnInvalidObjectType(returnFiber, newChild);
        }
        "function" === typeof newChild &&
          warnOnFunctionType(returnFiber, newChild);
        "symbol" === typeof newChild && warnOnSymbolType(returnFiber, newChild);
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
                (newIdx =
                  existingChildren.get(
                    null === newChild.key ? newIdx : newChild.key
                  ) || null),
                (existingChildren = pushDebugInfo(newChild._debugInfo)),
                (returnFiber = updateElement(
                  returnFiber,
                  newIdx,
                  newChild,
                  lanes
                )),
                (currentDebugInfo = existingChildren),
                returnFiber
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
              var _prevDebugInfo7 = pushDebugInfo(newChild._debugInfo);
              newChild = resolveLazy(newChild);
              returnFiber = updateFromMap(
                existingChildren,
                returnFiber,
                newIdx,
                newChild,
                lanes
              );
              currentDebugInfo = _prevDebugInfo7;
              return returnFiber;
          }
          if (isArrayImpl(newChild) || getIteratorFn(newChild))
            return (
              (newIdx = existingChildren.get(newIdx) || null),
              (existingChildren = pushDebugInfo(newChild._debugInfo)),
              (returnFiber = updateFragment(
                returnFiber,
                newIdx,
                newChild,
                lanes,
                null
              )),
              (currentDebugInfo = existingChildren),
              returnFiber
            );
          if ("function" === typeof newChild.then)
            return (
              (_prevDebugInfo7 = pushDebugInfo(newChild._debugInfo)),
              (returnFiber = updateFromMap(
                existingChildren,
                returnFiber,
                newIdx,
                unwrapThenable(newChild),
                lanes
              )),
              (currentDebugInfo = _prevDebugInfo7),
              returnFiber
            );
          if (newChild.$$typeof === REACT_CONTEXT_TYPE)
            return updateFromMap(
              existingChildren,
              returnFiber,
              newIdx,
              readContextDuringReconciliation(returnFiber, newChild),
              lanes
            );
          throwOnInvalidObjectType(returnFiber, newChild);
        }
        "function" === typeof newChild &&
          warnOnFunctionType(returnFiber, newChild);
        "symbol" === typeof newChild && warnOnSymbolType(returnFiber, newChild);
        return null;
      }
      function warnOnInvalidKey(returnFiber, workInProgress, child, knownKeys) {
        if ("object" !== typeof child || null === child) return knownKeys;
        switch (child.$$typeof) {
          case REACT_ELEMENT_TYPE:
          case REACT_PORTAL_TYPE:
            warnForMissingKey(returnFiber, workInProgress, child);
            var key = child.key;
            if ("string" !== typeof key) break;
            if (null === knownKeys) {
              knownKeys = new Set();
              knownKeys.add(key);
              break;
            }
            if (!knownKeys.has(key)) {
              knownKeys.add(key);
              break;
            }
            runWithFiberInDEV(workInProgress, function () {
              console.error(
                "Encountered two children with the same key, `%s`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted \u2014 the behavior is unsupported and could change in a future version.",
                key
              );
            });
            break;
          case REACT_LAZY_TYPE:
            (child = resolveLazy(child)),
              warnOnInvalidKey(returnFiber, workInProgress, child, knownKeys);
        }
        return knownKeys;
      }
      function reconcileChildrenArray(
        returnFiber,
        currentFirstChild,
        newChildren,
        lanes
      ) {
        for (
          var knownKeys = null,
            resultingFirstChild = null,
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
          knownKeys = warnOnInvalidKey(
            returnFiber,
            newFiber,
            newChildren[newIdx],
            knownKeys
          );
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
                ((knownKeys = warnOnInvalidKey(
                  returnFiber,
                  oldFiber,
                  newChildren[newIdx],
                  knownKeys
                )),
                (currentFirstChild = placeChild(
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
              ((knownKeys = warnOnInvalidKey(
                returnFiber,
                nextOldFiber,
                newChildren[newIdx],
                knownKeys
              )),
              shouldTrackSideEffects &&
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
        if (null == newChildren)
          throw Error("An iterable object provided no iterator.");
        for (
          var resultingFirstChild = null,
            previousNewFiber = null,
            oldFiber = currentFirstChild,
            newIdx = (currentFirstChild = 0),
            nextOldFiber = null,
            knownKeys = null,
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
          knownKeys = warnOnInvalidKey(
            returnFiber,
            newFiber,
            step.value,
            knownKeys
          );
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
            (oldFiber = createChild(returnFiber, step.value, lanes)),
              null !== oldFiber &&
                ((knownKeys = warnOnInvalidKey(
                  returnFiber,
                  oldFiber,
                  step.value,
                  knownKeys
                )),
                (currentFirstChild = placeChild(
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
          !step.done;
          newIdx++, step = newChildren.next()
        )
          (nextOldFiber = updateFromMap(
            oldFiber,
            returnFiber,
            newIdx,
            step.value,
            lanes
          )),
            null !== nextOldFiber &&
              ((knownKeys = warnOnInvalidKey(
                returnFiber,
                nextOldFiber,
                step.value,
                knownKeys
              )),
              shouldTrackSideEffects &&
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
          (validateFragmentProps(newChild, null, returnFiber),
          (newChild = newChild.props.children));
        if ("object" === typeof newChild && null !== newChild) {
          switch (newChild.$$typeof) {
            case REACT_ELEMENT_TYPE:
              var prevDebugInfo = pushDebugInfo(newChild._debugInfo);
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
                        lanes._debugOwner = newChild._owner;
                        lanes._debugInfo = currentDebugInfo;
                        validateFragmentProps(newChild, lanes, returnFiber);
                        returnFiber = lanes;
                        break a;
                      }
                    } else if (
                      currentFirstChild.elementType === key ||
                      isCompatibleFamilyForHotReloading(
                        currentFirstChild,
                        newChild
                      ) ||
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
                      lanes._debugOwner = newChild._owner;
                      lanes._debugInfo = currentDebugInfo;
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
                    (lanes._debugOwner = returnFiber),
                    (lanes._debugTask = returnFiber._debugTask),
                    (lanes._debugInfo = currentDebugInfo),
                    validateFragmentProps(newChild, lanes, returnFiber),
                    (returnFiber = lanes))
                  : ((lanes = createFiberFromElement(
                      newChild,
                      returnFiber.mode,
                      lanes
                    )),
                    coerceRef(lanes, newChild),
                    (lanes.return = returnFiber),
                    (lanes._debugInfo = currentDebugInfo),
                    (returnFiber = lanes));
              }
              returnFiber = placeSingleChild(returnFiber);
              currentDebugInfo = prevDebugInfo;
              return returnFiber;
            case REACT_PORTAL_TYPE:
              a: {
                prevDebugInfo = newChild;
                for (
                  newChild = prevDebugInfo.key;
                  null !== currentFirstChild;

                ) {
                  if (currentFirstChild.key === newChild)
                    if (
                      4 === currentFirstChild.tag &&
                      currentFirstChild.stateNode.containerInfo ===
                        prevDebugInfo.containerInfo &&
                      currentFirstChild.stateNode.implementation ===
                        prevDebugInfo.implementation
                    ) {
                      deleteRemainingChildren(
                        returnFiber,
                        currentFirstChild.sibling
                      );
                      lanes = useFiber(
                        currentFirstChild,
                        prevDebugInfo.children || []
                      );
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
                lanes = createFiberFromPortal(
                  prevDebugInfo,
                  returnFiber.mode,
                  lanes
                );
                lanes.return = returnFiber;
                returnFiber = lanes;
              }
              return placeSingleChild(returnFiber);
            case REACT_LAZY_TYPE:
              return (
                (prevDebugInfo = pushDebugInfo(newChild._debugInfo)),
                (newChild = resolveLazy(newChild)),
                (returnFiber = reconcileChildFibersImpl(
                  returnFiber,
                  currentFirstChild,
                  newChild,
                  lanes
                )),
                (currentDebugInfo = prevDebugInfo),
                returnFiber
              );
          }
          if (isArrayImpl(newChild))
            return (
              (prevDebugInfo = pushDebugInfo(newChild._debugInfo)),
              (returnFiber = reconcileChildrenArray(
                returnFiber,
                currentFirstChild,
                newChild,
                lanes
              )),
              (currentDebugInfo = prevDebugInfo),
              returnFiber
            );
          if (getIteratorFn(newChild)) {
            prevDebugInfo = pushDebugInfo(newChild._debugInfo);
            key = getIteratorFn(newChild);
            if ("function" !== typeof key)
              throw Error(
                "An object is not an iterable. This error is likely caused by a bug in React. Please file an issue."
              );
            var newChildren = key.call(newChild);
            if (newChildren === newChild) {
              if (
                0 !== returnFiber.tag ||
                "[object GeneratorFunction]" !==
                  Object.prototype.toString.call(returnFiber.type) ||
                "[object Generator]" !==
                  Object.prototype.toString.call(newChildren)
              )
                didWarnAboutGenerators ||
                  console.error(
                    "Using Iterators as children is unsupported and will likely yield unexpected results because enumerating a generator mutates it. You may convert it to an array with `Array.from()` or the `[...spread]` operator before rendering. You can also use an Iterable that can iterate multiple times over the same items."
                  ),
                  (didWarnAboutGenerators = !0);
            } else
              newChild.entries !== key ||
                didWarnAboutMaps ||
                (console.error(
                  "Using Maps as children is not supported. Use an array of keyed ReactElements instead."
                ),
                (didWarnAboutMaps = !0));
            returnFiber = reconcileChildrenIterator(
              returnFiber,
              currentFirstChild,
              newChildren,
              lanes
            );
            currentDebugInfo = prevDebugInfo;
            return returnFiber;
          }
          if ("function" === typeof newChild.then)
            return (
              (prevDebugInfo = pushDebugInfo(newChild._debugInfo)),
              (returnFiber = reconcileChildFibersImpl(
                returnFiber,
                currentFirstChild,
                unwrapThenable(newChild),
                lanes
              )),
              (currentDebugInfo = prevDebugInfo),
              returnFiber
            );
          if (newChild.$$typeof === REACT_CONTEXT_TYPE)
            return reconcileChildFibersImpl(
              returnFiber,
              currentFirstChild,
              readContextDuringReconciliation(returnFiber, newChild),
              lanes
            );
          throwOnInvalidObjectType(returnFiber, newChild);
        }
        if (
          ("string" === typeof newChild && "" !== newChild) ||
          "number" === typeof newChild ||
          "bigint" === typeof newChild
        )
          return (
            (prevDebugInfo = "" + newChild),
            null !== currentFirstChild && 6 === currentFirstChild.tag
              ? (deleteRemainingChildren(
                  returnFiber,
                  currentFirstChild.sibling
                ),
                (lanes = useFiber(currentFirstChild, prevDebugInfo)),
                (lanes.return = returnFiber),
                (returnFiber = lanes))
              : (deleteRemainingChildren(returnFiber, currentFirstChild),
                (lanes = createFiberFromText(
                  prevDebugInfo,
                  returnFiber.mode,
                  lanes
                )),
                (lanes.return = returnFiber),
                (lanes._debugOwner = returnFiber),
                (lanes._debugTask = returnFiber._debugTask),
                (lanes._debugInfo = currentDebugInfo),
                (returnFiber = lanes)),
            placeSingleChild(returnFiber)
          );
        "function" === typeof newChild &&
          warnOnFunctionType(returnFiber, newChild);
        "symbol" === typeof newChild && warnOnSymbolType(returnFiber, newChild);
        return deleteRemainingChildren(returnFiber, currentFirstChild);
      }
      return function (returnFiber, currentFirstChild, newChild, lanes) {
        var prevDebugInfo = currentDebugInfo;
        currentDebugInfo = null;
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
          if (x === SuspenseException || x === SuspenseActionException) throw x;
          var fiber = createFiber(29, x, null, returnFiber.mode);
          fiber.lanes = lanes;
          fiber.return = returnFiber;
          var debugInfo = (fiber._debugInfo = currentDebugInfo);
          fiber._debugOwner = returnFiber._debugOwner;
          fiber._debugTask = returnFiber._debugTask;
          if (null != debugInfo)
            for (var i = debugInfo.length - 1; 0 <= i; i--)
              if ("string" === typeof debugInfo[i].stack) {
                fiber._debugOwner = debugInfo[i];
                fiber._debugTask = debugInfo[i].debugTask;
                break;
              }
          return fiber;
        } finally {
          currentDebugInfo = prevDebugInfo;
        }
      };
    }
    function validateSuspenseListNestedChild(childSlot, index) {
      var isAnArray = isArrayImpl(childSlot);
      childSlot = !isAnArray && "function" === typeof getIteratorFn(childSlot);
      return isAnArray || childSlot
        ? ((isAnArray = isAnArray ? "array" : "iterable"),
          console.error(
            "A nested %s was passed to row #%s in <SuspenseList />. Wrap it in an additional SuspenseList to configure its revealOrder: <SuspenseList revealOrder=...> ... <SuspenseList revealOrder=...>{%s}</SuspenseList> ... </SuspenseList>",
            isAnArray,
            index,
            isAnArray
          ),
          !1)
        : !0;
    }
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
            null === sourceFiber ||
              sourceFiber._visibility & OffscreenVisible ||
              (isHidden = !0)),
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
      throwIfInfiniteUpdateLoopDetected();
      null === sourceFiber.alternate &&
        0 !== (sourceFiber.flags & 4098) &&
        warnAboutUpdateOnNotYetMountedFiberInDEV(sourceFiber);
      for (var node = sourceFiber, parent = node.return; null !== parent; )
        null === node.alternate &&
          0 !== (node.flags & 4098) &&
          warnAboutUpdateOnNotYetMountedFiberInDEV(sourceFiber),
          (node = parent),
          (parent = node.return);
      return 3 === node.tag ? node.stateNode : null;
    }
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
      return {
        lane: lane,
        tag: UpdateState,
        payload: null,
        callback: null,
        next: null
      };
    }
    function enqueueUpdate(fiber, update, lane) {
      var updateQueue = fiber.updateQueue;
      if (null === updateQueue) return null;
      updateQueue = updateQueue.shared;
      if (
        currentlyProcessingQueue === updateQueue &&
        !didWarnUpdateInsideUpdate
      ) {
        var componentName = getComponentNameFromFiber(fiber);
        console.error(
          "An update (setState, replaceState, or forceUpdate) was scheduled from inside an update function. Update functions should be pure, with zero side-effects. Consider using componentDidUpdate or a callback.\n\nPlease update the following component: %s",
          componentName
        );
        didWarnUpdateInsideUpdate = !0;
      }
      if ((executionContext & RenderContext) !== NoContext)
        return (
          (componentName = updateQueue.pending),
          null === componentName
            ? (update.next = update)
            : ((update.next = componentName.next),
              (componentName.next = update)),
          (updateQueue.pending = update),
          (update = getRootForUpdatedFiber(fiber)),
          markUpdateLaneFromFiberToRoot(fiber, null, lane),
          update
        );
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
    function suspendIfUpdateReadFromEntangledAsyncAction() {
      if (didReadFromEntangledAsyncAction) {
        var entangledActionThenable = currentEntangledActionThenable;
        if (null !== entangledActionThenable) throw entangledActionThenable;
      }
    }
    function processUpdateQueue(
      workInProgress,
      props,
      instance$jscomp$0,
      renderLanes
    ) {
      didReadFromEntangledAsyncAction = !1;
      var queue = workInProgress.updateQueue;
      hasForceUpdate = !1;
      currentlyProcessingQueue = queue.shared;
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
        var current = workInProgress.alternate;
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
              updateLane = workInProgress;
              var partialState = pendingQueue;
              var nextProps = props,
                instance = instance$jscomp$0;
              switch (partialState.tag) {
                case ReplaceState:
                  partialState = partialState.payload;
                  if ("function" === typeof partialState) {
                    isDisallowedContextReadInDEV = !0;
                    var nextState = partialState.call(
                      instance,
                      newState,
                      nextProps
                    );
                    if (updateLane.mode & 8) {
                      setIsStrictModeForDevtools(!0);
                      try {
                        partialState.call(instance, newState, nextProps);
                      } finally {
                        setIsStrictModeForDevtools(!1);
                      }
                    }
                    isDisallowedContextReadInDEV = !1;
                    newState = nextState;
                    break a;
                  }
                  newState = partialState;
                  break a;
                case CaptureUpdate:
                  updateLane.flags = (updateLane.flags & -65537) | 128;
                case UpdateState:
                  nextState = partialState.payload;
                  if ("function" === typeof nextState) {
                    isDisallowedContextReadInDEV = !0;
                    partialState = nextState.call(
                      instance,
                      newState,
                      nextProps
                    );
                    if (updateLane.mode & 8) {
                      setIsStrictModeForDevtools(!0);
                      try {
                        nextState.call(instance, newState, nextProps);
                      } finally {
                        setIsStrictModeForDevtools(!1);
                      }
                    }
                    isDisallowedContextReadInDEV = !1;
                  } else partialState = nextState;
                  if (null === partialState || void 0 === partialState) break a;
                  newState = assign({}, newState, partialState);
                  break a;
                case ForceUpdate:
                  hasForceUpdate = !0;
              }
            }
            updateLane = pendingQueue.callback;
            null !== updateLane &&
              ((workInProgress.flags |= 64),
              isHiddenUpdate && (workInProgress.flags |= 8192),
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
        workInProgress.lanes = lastBaseUpdate;
        workInProgress.memoizedState = newState;
      }
      currentlyProcessingQueue = null;
    }
    function callCallback(callback, context) {
      if ("function" !== typeof callback)
        throw Error(
          "Invalid argument passed as callback. Expected a function. Instead received: " +
            callback
        );
      callback.call(context);
    }
    function commitHiddenCallbacks(updateQueue, context) {
      var hiddenCallbacks = updateQueue.shared.hiddenCallbacks;
      if (null !== hiddenCallbacks)
        for (
          updateQueue.shared.hiddenCallbacks = null, updateQueue = 0;
          updateQueue < hiddenCallbacks.length;
          updateQueue++
        )
          callCallback(hiddenCallbacks[updateQueue], context);
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
    function pushHiddenContext(fiber, context) {
      var prevEntangledRenderLanes = entangledRenderLanes;
      push(prevEntangledRenderLanesCursor, prevEntangledRenderLanes, fiber);
      push(currentTreeHiddenStackCursor, context, fiber);
      entangledRenderLanes = prevEntangledRenderLanes | context.baseLanes;
    }
    function reuseHiddenContextOnStack(fiber) {
      push(prevEntangledRenderLanesCursor, entangledRenderLanes, fiber);
      push(
        currentTreeHiddenStackCursor,
        currentTreeHiddenStackCursor.current,
        fiber
      );
    }
    function popHiddenContext(fiber) {
      entangledRenderLanes = prevEntangledRenderLanesCursor.current;
      pop(currentTreeHiddenStackCursor, fiber);
      pop(prevEntangledRenderLanesCursor, fiber);
    }
    function pushPrimaryTreeSuspenseHandler(handler) {
      var current = handler.alternate,
        props = handler.pendingProps;
      push(
        suspenseStackCursor,
        suspenseStackCursor.current & SubtreeSuspenseContextMask,
        handler
      );
      !0 !== props.unstable_avoidThisFallback ||
      (null !== current && null === currentTreeHiddenStackCursor.current)
        ? (push(suspenseHandlerStackCursor, handler, handler),
          null === shellBoundary &&
            (null === current || null !== currentTreeHiddenStackCursor.current
              ? (shellBoundary = handler)
              : null !== current.memoizedState && (shellBoundary = handler)))
        : null === shellBoundary
          ? push(suspenseHandlerStackCursor, handler, handler)
          : push(
              suspenseHandlerStackCursor,
              suspenseHandlerStackCursor.current,
              handler
            );
    }
    function pushDehydratedActivitySuspenseHandler(fiber) {
      push(suspenseStackCursor, suspenseStackCursor.current, fiber);
      push(suspenseHandlerStackCursor, fiber, fiber);
      null === shellBoundary && (shellBoundary = fiber);
    }
    function pushOffscreenSuspenseHandler(fiber) {
      22 === fiber.tag
        ? (push(suspenseStackCursor, suspenseStackCursor.current, fiber),
          push(suspenseHandlerStackCursor, fiber, fiber),
          null === shellBoundary && (shellBoundary = fiber))
        : reuseSuspenseHandlerOnStack(fiber);
    }
    function reuseSuspenseHandlerOnStack(fiber) {
      push(suspenseStackCursor, suspenseStackCursor.current, fiber);
      push(
        suspenseHandlerStackCursor,
        suspenseHandlerStackCursor.current,
        fiber
      );
    }
    function popSuspenseHandler(fiber) {
      pop(suspenseHandlerStackCursor, fiber);
      shellBoundary === fiber && (shellBoundary = null);
      pop(suspenseStackCursor, fiber);
    }
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
    function mountHookTypesDev() {
      var hookName = currentHookNameInDev;
      null === hookTypesDev
        ? (hookTypesDev = [hookName])
        : hookTypesDev.push(hookName);
    }
    function updateHookTypesDev() {
      var hookName = currentHookNameInDev;
      if (
        null !== hookTypesDev &&
        (hookTypesUpdateIndexDev++,
        hookTypesDev[hookTypesUpdateIndexDev] !== hookName)
      ) {
        var componentName = getComponentNameFromFiber(currentlyRenderingFiber);
        if (
          !didWarnAboutMismatchedHooksForComponent.has(componentName) &&
          (didWarnAboutMismatchedHooksForComponent.add(componentName),
          null !== hookTypesDev)
        ) {
          for (var table = "", i = 0; i <= hookTypesUpdateIndexDev; i++) {
            var oldHookName = hookTypesDev[i],
              newHookName =
                i === hookTypesUpdateIndexDev ? hookName : oldHookName;
            for (
              oldHookName = i + 1 + ". " + oldHookName;
              30 > oldHookName.length;

            )
              oldHookName += " ";
            oldHookName += newHookName + "\n";
            table += oldHookName;
          }
          console.error(
            "React has detected a change in the order of Hooks called by %s. This will lead to bugs and errors if not fixed. For more information, read the Rules of Hooks: https://react.dev/link/rules-of-hooks\n\n   Previous render            Next render\n   ------------------------------------------------------\n%s   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n",
            componentName,
            table
          );
        }
      }
    }
    function checkDepsAreArrayDev(deps) {
      void 0 === deps ||
        null === deps ||
        isArrayImpl(deps) ||
        console.error(
          "%s received a final argument that is not an array (instead, received `%s`). When specified, the final argument must be an array.",
          currentHookNameInDev,
          typeof deps
        );
    }
    function warnOnUseFormStateInDev() {
      var componentName = getComponentNameFromFiber(currentlyRenderingFiber);
      didWarnAboutUseFormState.has(componentName) ||
        (didWarnAboutUseFormState.add(componentName),
        console.error(
          "ReactDOM.useFormState has been renamed to React.useActionState. Please update %s to use React.useActionState.",
          componentName
        ));
    }
    function throwInvalidHookError() {
      throw Error(
        "Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:\n1. You might have mismatching versions of React and the renderer (such as React DOM)\n2. You might be breaking the Rules of Hooks\n3. You might have more than one copy of React in the same app\nSee https://react.dev/link/invalid-hook-call for tips about how to debug and fix this problem."
      );
    }
    function areHookInputsEqual(nextDeps, prevDeps) {
      if (ignorePreviousDependencies) return !1;
      if (null === prevDeps)
        return (
          console.error(
            "%s received a final argument during this render, but not during the previous render. Even though the final argument is optional, its type cannot change between renders.",
            currentHookNameInDev
          ),
          !1
        );
      nextDeps.length !== prevDeps.length &&
        console.error(
          "The final argument passed to %s changed size between renders. The order and size of this array must remain constant.\n\nPrevious: %s\nIncoming: %s",
          currentHookNameInDev,
          "[" + prevDeps.join(", ") + "]",
          "[" + nextDeps.join(", ") + "]"
        );
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
      hookTypesDev = null !== current ? current._debugHookTypes : null;
      hookTypesUpdateIndexDev = -1;
      ignorePreviousDependencies =
        null !== current && current.type !== workInProgress.type;
      if (
        "[object AsyncFunction]" ===
          Object.prototype.toString.call(Component) ||
        "[object AsyncGeneratorFunction]" ===
          Object.prototype.toString.call(Component)
      )
        (nextRenderLanes = getComponentNameFromFiber(currentlyRenderingFiber)),
          didWarnAboutAsyncClientComponent.has(nextRenderLanes) ||
            (didWarnAboutAsyncClientComponent.add(nextRenderLanes),
            console.error(
              "%s is an async Client Component. Only Server Components can be async at the moment. This error is often caused by accidentally adding `'use client'` to a module that was originally written for the server.",
              null === nextRenderLanes
                ? "An unknown Component"
                : "<" + nextRenderLanes + ">"
            ));
      workInProgress.memoizedState = null;
      workInProgress.updateQueue = null;
      workInProgress.lanes = 0;
      ReactSharedInternals.H =
        null !== current && null !== current.memoizedState
          ? HooksDispatcherOnUpdateInDEV
          : null !== hookTypesDev
            ? HooksDispatcherOnMountWithHookTypesInDEV
            : HooksDispatcherOnMountInDEV;
      shouldDoubleInvokeUserFnsInHooksDEV = nextRenderLanes =
        (workInProgress.mode & 8) !== NoMode;
      var children = callComponentInDEV(Component, props, secondArg);
      shouldDoubleInvokeUserFnsInHooksDEV = !1;
      didScheduleRenderPhaseUpdateDuringThisPass &&
        (children = renderWithHooksAgain(
          workInProgress,
          Component,
          props,
          secondArg
        ));
      if (nextRenderLanes) {
        setIsStrictModeForDevtools(!0);
        try {
          children = renderWithHooksAgain(
            workInProgress,
            Component,
            props,
            secondArg
          );
        } finally {
          setIsStrictModeForDevtools(!1);
        }
      }
      finishRenderingHooks(current, workInProgress);
      return children;
    }
    function finishRenderingHooks(current, workInProgress) {
      workInProgress._debugHookTypes = hookTypesDev;
      null === workInProgress.dependencies
        ? null !== thenableState &&
          (workInProgress.dependencies = {
            lanes: 0,
            firstContext: null,
            _debugThenableState: thenableState
          })
        : (workInProgress.dependencies._debugThenableState = thenableState);
      ReactSharedInternals.H = ContextOnlyDispatcher;
      var didRenderTooFewHooks =
        null !== currentHook && null !== currentHook.next;
      renderLanes = 0;
      hookTypesDev =
        currentHookNameInDev =
        workInProgressHook =
        currentHook =
        currentlyRenderingFiber =
          null;
      hookTypesUpdateIndexDev = -1;
      null !== current &&
        (current.flags & 65011712) !== (workInProgress.flags & 65011712) &&
        console.error(
          "Internal React error: Expected static flag was missing. Please notify the React team."
        );
      didScheduleRenderPhaseUpdate = !1;
      thenableIndexCounter = 0;
      thenableState = null;
      if (didRenderTooFewHooks)
        throw Error(
          "Rendered fewer hooks than expected. This may be caused by an accidental early return statement."
        );
      null === current ||
        didReceiveUpdate ||
        ((current = current.dependencies),
        null !== current &&
          checkIfContextChanged(current) &&
          (didReceiveUpdate = !0));
      needsToResetSuspendedThenableDEV
        ? ((needsToResetSuspendedThenableDEV = !1), (current = !0))
        : (current = !1);
      current &&
        ((workInProgress =
          getComponentNameFromFiber(workInProgress) || "Unknown"),
        didWarnAboutUseWrappedInTryCatch.has(workInProgress) ||
          didWarnAboutAsyncClientComponent.has(workInProgress) ||
          (didWarnAboutUseWrappedInTryCatch.add(workInProgress),
          console.error(
            "`use` was called from inside a try/catch block. This is not allowed and can lead to unexpected behavior. To handle errors triggered by `use`, wrap your component in a error boundary."
          )));
    }
    function renderWithHooksAgain(workInProgress, Component, props, secondArg) {
      currentlyRenderingFiber = workInProgress;
      var numberOfReRenders = 0;
      do {
        didScheduleRenderPhaseUpdateDuringThisPass && (thenableState = null);
        thenableIndexCounter = 0;
        didScheduleRenderPhaseUpdateDuringThisPass = !1;
        if (numberOfReRenders >= RE_RENDER_LIMIT)
          throw Error(
            "Too many re-renders. React limits the number of renders to prevent an infinite loop."
          );
        numberOfReRenders += 1;
        ignorePreviousDependencies = !1;
        workInProgressHook = currentHook = null;
        if (null != workInProgress.updateQueue) {
          var children = workInProgress.updateQueue;
          children.lastEffect = null;
          children.events = null;
          children.stores = null;
          null != children.memoCache && (children.memoCache.index = 0);
        }
        hookTypesUpdateIndexDev = -1;
        ReactSharedInternals.H = HooksDispatcherOnRerenderInDEV;
        children = callComponentInDEV(Component, props, secondArg);
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
      (null !== currentHook ? currentHook.memoizedState : null) !==
        dispatcher && (currentlyRenderingFiber.flags |= 1024);
      return maybeThenable;
    }
    function checkDidRenderIdHook() {
      var didRenderIdHook = 0 !== localIdCounter;
      localIdCounter = 0;
      return didRenderIdHook;
    }
    function bailoutHooks(current, workInProgress, lanes) {
      workInProgress.updateQueue = current.updateQueue;
      workInProgress.flags =
        (workInProgress.mode & 16) !== NoMode
          ? workInProgress.flags & -402655237
          : workInProgress.flags & -2053;
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
      hookTypesDev =
        workInProgressHook =
        currentHook =
        currentlyRenderingFiber =
          null;
      hookTypesUpdateIndexDev = -1;
      currentHookNameInDev = null;
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
            throw Error(
              "Update hook called on initial render. This is likely a bug in React. Please file an issue."
            );
          throw Error("Rendered more hooks than during the previous render.");
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
      null === thenableState && (thenableState = createThenableState());
      thenable = trackUsedThenable(thenableState, thenable, index);
      index = currentlyRenderingFiber;
      null ===
        (null === workInProgressHook
          ? index.memoizedState
          : workInProgressHook.next) &&
        ((index = index.alternate),
        (ReactSharedInternals.H =
          null !== index && null !== index.memoizedState
            ? HooksDispatcherOnUpdateInDEV
            : HooksDispatcherOnMountInDEV));
      return thenable;
    }
    function use(usable) {
      if (null !== usable && "object" === typeof usable) {
        if ("function" === typeof usable.then) return useThenable(usable);
        if (usable.$$typeof === REACT_CONTEXT_TYPE) return readContext(usable);
      }
      throw Error("An unsupported type was passed to use(): " + String(usable));
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
                data: enableNoCloningMemoCache
                  ? current.data
                  : current.data.map(function (array) {
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
      if (void 0 === updateQueue || ignorePreviousDependencies)
        for (
          updateQueue = memoCache.data[memoCache.index] = Array(size),
            current = 0;
          current < size;
          current++
        )
          updateQueue[current] = REACT_MEMO_CACHE_SENTINEL;
      else
        updateQueue.length !== size &&
          console.error(
            "Expected a constant size argument for each invocation of useMemoCache. The previous cache was allocated with size %s but size %s was requested.",
            updateQueue.length,
            size
          );
      memoCache.index++;
      return updateQueue;
    }
    function basicStateReducer(state, action) {
      return "function" === typeof action ? action(state) : action;
    }
    function mountReducer(reducer, initialArg, init) {
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
    }
    function updateReducer(reducer) {
      var hook = updateWorkInProgressHook();
      return updateReducerImpl(hook, currentHook, reducer);
    }
    function updateReducerImpl(hook, current, reducer) {
      var queue = hook.queue;
      if (null === queue)
        throw Error(
          "Should have a queue. You are likely calling Hooks conditionally, which is not allowed. (https://react.dev/link/invalid-hook-call)"
        );
      queue.lastRenderedReducer = reducer;
      var baseQueue = hook.baseQueue,
        pendingQueue = queue.pending;
      if (null !== pendingQueue) {
        if (null !== baseQueue) {
          var baseFirst = baseQueue.next;
          baseQueue.next = pendingQueue.next;
          pendingQueue.next = baseFirst;
        }
        current.baseQueue !== baseQueue &&
          console.error(
            "Internal error: Expected work-in-progress queue to be a clone. This is a bug in React."
          );
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
          didReadFromEntangledAsyncAction = !1;
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
                  (didReadFromEntangledAsyncAction = !0);
            else if ((renderLanes & revertLane) === revertLane) {
              update = update.next;
              revertLane === currentEntangledLane &&
                (didReadFromEntangledAsyncAction = !0);
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
          didReadFromEntangledAsyncAction &&
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
      if (null === queue)
        throw Error(
          "Should have a queue. You are likely calling Hooks conditionally, which is not allowed. (https://react.dev/link/invalid-hook-call)"
        );
      queue.lastRenderedReducer = reducer;
      var dispatch = queue.dispatch,
        lastRenderPhaseUpdate = queue.pending,
        newState = hook.memoizedState;
      if (null !== lastRenderPhaseUpdate) {
        queue.pending = null;
        var update = (lastRenderPhaseUpdate = lastRenderPhaseUpdate.next);
        do
          (newState = reducer(newState, update.action)), (update = update.next);
        while (update !== lastRenderPhaseUpdate);
        objectIs(newState, hook.memoizedState) || (didReceiveUpdate = !0);
        hook.memoizedState = newState;
        null === hook.baseQueue && (hook.baseState = newState);
        queue.lastRenderedState = newState;
      }
      return [newState, dispatch];
    }
    function mountSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) {
      var fiber = currentlyRenderingFiber,
        hook = mountWorkInProgressHook();
      if (isHydrating) {
        if (void 0 === getServerSnapshot)
          throw Error(
            "Missing getServerSnapshot, which is required for server-rendered content. Will revert to client rendering."
          );
        var nextSnapshot = getServerSnapshot();
        didWarnUncachedGetSnapshot ||
          nextSnapshot === getServerSnapshot() ||
          (console.error(
            "The result of getServerSnapshot should be cached to avoid an infinite loop"
          ),
          (didWarnUncachedGetSnapshot = !0));
      } else {
        nextSnapshot = getSnapshot();
        didWarnUncachedGetSnapshot ||
          ((getServerSnapshot = getSnapshot()),
          objectIs(nextSnapshot, getServerSnapshot) ||
            (console.error(
              "The result of getSnapshot should be cached to avoid an infinite loop"
            ),
            (didWarnUncachedGetSnapshot = !0)));
        if (null === workInProgressRoot)
          throw Error(
            "Expected a work-in-progress root. This is a bug in React. Please file an issue."
          );
        0 !== (workInProgressRootRenderLanes & 127) ||
          pushStoreConsistencyCheck(fiber, getSnapshot, nextSnapshot);
      }
      hook.memoizedState = nextSnapshot;
      getServerSnapshot = { value: nextSnapshot, getSnapshot: getSnapshot };
      hook.queue = getServerSnapshot;
      mountEffect(
        subscribeToStore.bind(null, fiber, getServerSnapshot, subscribe),
        [subscribe]
      );
      fiber.flags |= 2048;
      pushSimpleEffect(
        HasEffect | Passive,
        { destroy: void 0 },
        updateStoreInstance.bind(
          null,
          fiber,
          getServerSnapshot,
          nextSnapshot,
          getSnapshot
        ),
        null
      );
      return nextSnapshot;
    }
    function updateSyncExternalStore(
      subscribe,
      getSnapshot,
      getServerSnapshot
    ) {
      var fiber = currentlyRenderingFiber,
        hook = updateWorkInProgressHook(),
        isHydrating$jscomp$0 = isHydrating;
      if (isHydrating$jscomp$0) {
        if (void 0 === getServerSnapshot)
          throw Error(
            "Missing getServerSnapshot, which is required for server-rendered content. Will revert to client rendering."
          );
        getServerSnapshot = getServerSnapshot();
      } else if (
        ((getServerSnapshot = getSnapshot()), !didWarnUncachedGetSnapshot)
      ) {
        var cachedSnapshot = getSnapshot();
        objectIs(getServerSnapshot, cachedSnapshot) ||
          (console.error(
            "The result of getSnapshot should be cached to avoid an infinite loop"
          ),
          (didWarnUncachedGetSnapshot = !0));
      }
      if (
        (cachedSnapshot = !objectIs(
          (currentHook || hook).memoizedState,
          getServerSnapshot
        ))
      )
        (hook.memoizedState = getServerSnapshot), (didReceiveUpdate = !0);
      hook = hook.queue;
      var create = subscribeToStore.bind(null, fiber, hook, subscribe);
      updateEffectImpl(2048, Passive, create, [subscribe]);
      if (
        hook.getSnapshot !== getSnapshot ||
        cachedSnapshot ||
        (null !== workInProgressHook &&
          workInProgressHook.memoizedState.tag & HasEffect)
      ) {
        fiber.flags |= 2048;
        pushSimpleEffect(
          HasEffect | Passive,
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
        if (null === workInProgressRoot)
          throw Error(
            "Expected a work-in-progress root. This is a bug in React. Please file an issue."
          );
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
          (startUpdateTimerByLane(2, "updateSyncExternalStore()", fiber),
          forceStoreRerender(fiber));
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
    function mountState(initialState) {
      initialState = mountStateImpl(initialState);
      var queue = initialState.queue,
        dispatch = dispatchSetState.bind(null, currentlyRenderingFiber, queue);
      queue.dispatch = dispatch;
      return [initialState.memoizedState, dispatch];
    }
    function mountOptimistic(passthrough) {
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
    }
    function updateOptimistic(passthrough, reducer) {
      var hook = updateWorkInProgressHook();
      return updateOptimisticImpl(hook, currentHook, passthrough, reducer);
    }
    function updateOptimisticImpl(hook, current, passthrough, reducer) {
      hook.baseState = passthrough;
      return updateReducerImpl(
        hook,
        currentHook,
        "function" === typeof reducer ? reducer : basicStateReducer
      );
    }
    function rerenderOptimistic(passthrough, reducer) {
      var hook = updateWorkInProgressHook();
      if (null !== currentHook)
        return updateOptimisticImpl(hook, currentHook, passthrough, reducer);
      hook.baseState = passthrough;
      return [passthrough, hook.queue.dispatch];
    }
    function dispatchActionState(
      fiber,
      actionQueue,
      setPendingState,
      setState,
      payload
    ) {
      if (isRenderPhaseUpdate(fiber))
        throw Error("Cannot update form state while rendering.");
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
        enableViewTransition &&
          (currentTransition.types =
            null !== prevTransition ? prevTransition.types : null);
        enableTransitionTracing &&
          ((currentTransition.name = null), (currentTransition.startTime = -1));
        currentTransition._updatedFibers = new Set();
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
            (null !== prevTransition.types &&
              prevTransition.types !== currentTransition.types &&
              console.error(
                "We expected inner Transitions to have transferred the outer types set and that you cannot add to the outer Transition while inside the inner.This is a bug in React."
              ),
            (prevTransition.types = currentTransition.types)),
            (ReactSharedInternals.T = prevTransition),
            null === prevTransition &&
              currentTransition._updatedFibers &&
              ((actionQueue = currentTransition._updatedFibers.size),
              currentTransition._updatedFibers.clear(),
              10 < actionQueue &&
                console.warn(
                  "Detected a large number of updates inside startTransition. If this is due to a subscription please re-write it to use React provided hooks. Otherwise concurrent mode guarantees are off the table."
                ));
        }
      } else
        try {
          (currentTransition = action(prevState, payload)),
            handleActionReturnValue(actionQueue, node, currentTransition);
        } catch (error$2) {
          onActionError(actionQueue, node, error$2);
        }
    }
    function handleActionReturnValue(actionQueue, node, returnValue) {
      null !== returnValue &&
      "object" === typeof returnValue &&
      "function" === typeof returnValue.then
        ? (ReactSharedInternals.asyncTransitions++,
          returnValue.then(releaseAsyncTransition, releaseAsyncTransition),
          returnValue.then(
            function (nextState) {
              onActionSuccess(actionQueue, node, nextState);
            },
            function (error) {
              return onActionError(actionQueue, node, error);
            }
          ),
          node.isTransition ||
            console.error(
              "An async function with useActionState was called outside of a transition. This is likely not what you intended (for example, isPending will not update correctly). Either call the returned function inside startTransition, or pass it to an `action` or `formAction` prop."
            ))
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
            var isMatching = currentlyRenderingFiber;
            if (isHydrating) {
              if (nextHydratableInstance) {
                var markerInstance = canHydrateFormStateMarker(
                  nextHydratableInstance,
                  rootOrSingletonContext
                );
                if (markerInstance) {
                  nextHydratableInstance =
                    getNextHydratableSibling(markerInstance);
                  isMatching = isFormStateMarkerMatching(markerInstance);
                  break a;
                }
              }
              throwOnHydrationMismatch(isMatching);
            }
            isMatching = !1;
          }
          isMatching && (initialStateProp = ssrFormState[0]);
        }
      }
      ssrFormState = mountWorkInProgressHook();
      ssrFormState.memoizedState = ssrFormState.baseState = initialStateProp;
      isMatching = {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: actionStateReducer,
        lastRenderedState: initialStateProp
      };
      ssrFormState.queue = isMatching;
      ssrFormState = dispatchSetState.bind(
        null,
        currentlyRenderingFiber,
        isMatching
      );
      isMatching.dispatch = ssrFormState;
      isMatching = mountStateImpl(!1);
      var setPendingState = dispatchOptimisticSetState.bind(
        null,
        currentlyRenderingFiber,
        !1,
        isMatching.queue
      );
      isMatching = mountWorkInProgressHook();
      markerInstance = {
        state: initialStateProp,
        dispatch: null,
        action: action,
        pending: null
      };
      isMatching.queue = markerInstance;
      ssrFormState = dispatchActionState.bind(
        null,
        currentlyRenderingFiber,
        markerInstance,
        setPendingState,
        ssrFormState
      );
      markerInstance.dispatch = ssrFormState;
      isMatching.memoizedState = action;
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
          HasEffect | Passive,
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
    function mountRef(initialValue) {
      var hook = mountWorkInProgressHook();
      initialValue = { current: initialValue };
      return (hook.memoizedState = initialValue);
    }
    function mountEffectImpl(fiberFlags, hookFlags, create, deps) {
      var hook = mountWorkInProgressHook();
      currentlyRenderingFiber.flags |= fiberFlags;
      hook.memoizedState = pushSimpleEffect(
        HasEffect | hookFlags,
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
            HasEffect | hookFlags,
            inst,
            create,
            deps
          )));
    }
    function mountEffect(create, deps) {
      (currentlyRenderingFiber.mode & 16) !== NoMode
        ? mountEffectImpl(276826112, Passive, create, deps)
        : mountEffectImpl(8390656, Passive, create, deps);
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
    function mountEvent(callback) {
      var hook = mountWorkInProgressHook(),
        ref = { impl: callback };
      hook.memoizedState = ref;
      return function () {
        if ((executionContext & RenderContext) !== NoContext)
          throw Error(
            "A function wrapped in useEffectEvent can't be called during rendering."
          );
        return ref.impl.apply(void 0, arguments);
      };
    }
    function updateEvent(callback) {
      var ref = updateWorkInProgressHook().memoizedState;
      useEffectEventImpl({ ref: ref, nextImpl: callback });
      return function () {
        if ((executionContext & RenderContext) !== NoContext)
          throw Error(
            "A function wrapped in useEffectEvent can't be called during rendering."
          );
        return ref.impl.apply(void 0, arguments);
      };
    }
    function mountLayoutEffect(create, deps) {
      var fiberFlags = 4194308;
      (currentlyRenderingFiber.mode & 16) !== NoMode &&
        (fiberFlags |= 134217728);
      return mountEffectImpl(fiberFlags, Layout, create, deps);
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
          ref.hasOwnProperty("current") ||
            console.error(
              "Expected useImperativeHandle() first argument to either be a ref callback or React.createRef() object. Instead received: %s.",
              "an object with keys {" + Object.keys(ref).join(", ") + "}"
            ),
          (create = create()),
          (ref.current = create),
          function () {
            ref.current = null;
          }
        );
    }
    function mountImperativeHandle(ref, create, deps) {
      "function" !== typeof create &&
        console.error(
          "Expected useImperativeHandle() second argument to be a function that creates a handle. Instead received: %s.",
          null !== create ? typeof create : "null"
        );
      deps = null !== deps && void 0 !== deps ? deps.concat([ref]) : null;
      var fiberFlags = 4194308;
      (currentlyRenderingFiber.mode & 16) !== NoMode &&
        (fiberFlags |= 134217728);
      mountEffectImpl(
        fiberFlags,
        Layout,
        imperativeHandleEffect.bind(null, create, ref),
        deps
      );
    }
    function updateImperativeHandle(ref, create, deps) {
      "function" !== typeof create &&
        console.error(
          "Expected useImperativeHandle() second argument to be a function that creates a handle. Instead received: %s.",
          null !== create ? typeof create : "null"
        );
      deps = null !== deps && void 0 !== deps ? deps.concat([ref]) : null;
      updateEffectImpl(
        4,
        Layout,
        imperativeHandleEffect.bind(null, create, ref),
        deps
      );
    }
    function mountCallback(callback, deps) {
      mountWorkInProgressHook().memoizedState = [
        callback,
        void 0 === deps ? null : deps
      ];
      return callback;
    }
    function updateCallback(callback, deps) {
      var hook = updateWorkInProgressHook();
      deps = void 0 === deps ? null : deps;
      var prevState = hook.memoizedState;
      if (null !== deps && areHookInputsEqual(deps, prevState[1]))
        return prevState[0];
      hook.memoizedState = [callback, deps];
      return callback;
    }
    function mountMemo(nextCreate, deps) {
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
    function mountDeferredValue(value, initialValue) {
      var hook = mountWorkInProgressHook();
      return mountDeferredValueImpl(hook, value, initialValue);
    }
    function updateDeferredValue(value, initialValue) {
      var hook = updateWorkInProgressHook();
      return updateDeferredValueImpl(
        hook,
        currentHook.memoizedState,
        value,
        initialValue
      );
    }
    function rerenderDeferredValue(value, initialValue) {
      var hook = updateWorkInProgressHook();
      return null === currentHook
        ? mountDeferredValueImpl(hook, value, initialValue)
        : updateDeferredValueImpl(
            hook,
            currentHook.memoizedState,
            value,
            initialValue
          );
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
    function releaseAsyncTransition() {
      ReactSharedInternals.asyncTransitions--;
    }
    function startTransition(
      fiber,
      queue,
      pendingState,
      finishedState,
      callback,
      options
    ) {
      var previousPriority = getCurrentUpdatePriority();
      setCurrentUpdatePriority(
        0 !== previousPriority && 8 > previousPriority ? previousPriority : 8
      );
      var prevTransition = ReactSharedInternals.T,
        currentTransition = {};
      enableViewTransition &&
        (currentTransition.types =
          null !== prevTransition ? prevTransition.types : null);
      enableTransitionTracing &&
        ((currentTransition.name =
          void 0 !== options && void 0 !== options.name ? options.name : null),
        (currentTransition.startTime = now$1()));
      currentTransition._updatedFibers = new Set();
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
          ReactSharedInternals.asyncTransitions++;
          returnValue.then(releaseAsyncTransition, releaseAsyncTransition);
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
        setCurrentUpdatePriority(previousPriority),
          null !== prevTransition &&
            null !== currentTransition.types &&
            (null !== prevTransition.types &&
              prevTransition.types !== currentTransition.types &&
              console.error(
                "We expected inner Transitions to have transferred the outer types set and that you cannot add to the outer Transition while inside the inner.This is a bug in React."
              ),
            (prevTransition.types = currentTransition.types)),
          (ReactSharedInternals.T = prevTransition),
          null === prevTransition &&
            currentTransition._updatedFibers &&
            ((fiber = currentTransition._updatedFibers.size),
            currentTransition._updatedFibers.clear(),
            10 < fiber &&
              console.warn(
                "Detected a large number of updates inside startTransition. If this is due to a subscription please re-write it to use React provided hooks. Otherwise concurrent mode guarantees are off the table."
              ));
      }
    }
    function ensureFormComponentIsStateful(formFiber) {
      var existingStateHook = formFiber.memoizedState;
      if (null !== existingStateHook) return existingStateHook;
      existingStateHook = {
        memoizedState: NotPendingTransition,
        baseState: NotPendingTransition,
        baseQueue: null,
        queue: {
          pending: null,
          lanes: 0,
          dispatch: null,
          lastRenderedReducer: basicStateReducer,
          lastRenderedState: NotPendingTransition
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
    function mountTransition() {
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
    }
    function updateTransition() {
      var booleanOrThenable = updateReducer(basicStateReducer)[0],
        start = updateWorkInProgressHook().memoizedState;
      return [
        "boolean" === typeof booleanOrThenable
          ? booleanOrThenable
          : useThenable(booleanOrThenable),
        start
      ];
    }
    function rerenderTransition() {
      var booleanOrThenable = rerenderReducer(basicStateReducer)[0],
        start = updateWorkInProgressHook().memoizedState;
      return [
        "boolean" === typeof booleanOrThenable
          ? booleanOrThenable
          : useThenable(booleanOrThenable),
        start
      ];
    }
    function useHostTransitionStatus() {
      return readContext(HostTransitionContext);
    }
    function mountId() {
      var hook = mountWorkInProgressHook(),
        identifierPrefix = workInProgressRoot.identifierPrefix;
      if (isHydrating) {
        var treeId = treeContextOverflow;
        var idWithLeadingBit = treeContextId;
        treeId =
          (
            idWithLeadingBit & ~(1 << (32 - clz32(idWithLeadingBit) - 1))
          ).toString(32) + treeId;
        identifierPrefix = "_" + identifierPrefix + "R_" + treeId;
        treeId = localIdCounter++;
        0 < treeId && (identifierPrefix += "H" + treeId.toString(32));
        identifierPrefix += "_";
      } else
        (treeId = globalClientIdCounter++),
          (identifierPrefix =
            "_" + identifierPrefix + "r_" + treeId.toString(32) + "_");
      return (hook.memoizedState = identifierPrefix);
    }
    function mountRefresh() {
      return (mountWorkInProgressHook().memoizedState = refreshCache.bind(
        null,
        currentlyRenderingFiber
      ));
    }
    function refreshCache(fiber, seedKey, seedValue) {
      for (var provider = fiber.return; null !== provider; ) {
        switch (provider.tag) {
          case 24:
          case 3:
            var lane = requestUpdateLane(provider),
              refreshUpdate = createUpdate(lane),
              root = enqueueUpdate(provider, refreshUpdate, lane);
            null !== root &&
              (startUpdateTimerByLane(lane, "refresh()", fiber),
              scheduleUpdateOnFiber(root, provider, lane),
              entangleTransitions(root, provider, lane));
            fiber = createCache();
            null !== seedKey &&
              void 0 !== seedKey &&
              null !== root &&
              fiber.data.set(seedKey, seedValue);
            refreshUpdate.payload = { cache: fiber };
            return;
        }
        provider = provider.return;
      }
    }
    function dispatchReducerAction(fiber, queue, action) {
      var args = arguments;
      "function" === typeof args[3] &&
        console.error(
          "State updates from the useState() and useReducer() Hooks don't support the second callback argument. To execute a side effect after rendering, declare it in the component body with useEffect()."
        );
      args = requestUpdateLane(fiber);
      var update = {
        lane: args,
        revertLane: 0,
        gesture: null,
        action: action,
        hasEagerState: !1,
        eagerState: null,
        next: null
      };
      isRenderPhaseUpdate(fiber)
        ? enqueueRenderPhaseUpdate(queue, update)
        : ((update = enqueueConcurrentHookUpdate(fiber, queue, update, args)),
          null !== update &&
            (startUpdateTimerByLane(args, "dispatch()", fiber),
            scheduleUpdateOnFiber(update, fiber, args),
            entangleTransitionUpdate(update, queue, args)));
      enableSchedulingProfiler && markStateUpdateScheduled(fiber, args);
    }
    function dispatchSetState(fiber, queue, action) {
      var args = arguments;
      "function" === typeof args[3] &&
        console.error(
          "State updates from the useState() and useReducer() Hooks don't support the second callback argument. To execute a side effect after rendering, declare it in the component body with useEffect()."
        );
      args = requestUpdateLane(fiber);
      dispatchSetStateInternal(fiber, queue, action, args) &&
        startUpdateTimerByLane(args, "setState()", fiber);
      enableSchedulingProfiler && markStateUpdateScheduled(fiber, args);
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
        ) {
          var prevDispatcher = ReactSharedInternals.H;
          ReactSharedInternals.H = InvalidNestedHooksDispatcherOnUpdateInDEV;
          try {
            var currentState = queue.lastRenderedState,
              eagerState = alternate(currentState, action);
            update.hasEagerState = !0;
            update.eagerState = eagerState;
            if (objectIs(eagerState, currentState))
              return (
                enqueueUpdate$1(fiber, queue, update, 0),
                null === workInProgressRoot &&
                  finishQueueingConcurrentUpdates(),
                !1
              );
          } catch (error) {
          } finally {
            ReactSharedInternals.H = prevDispatcher;
          }
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
    function dispatchOptimisticSetState(
      fiber,
      throwIfDuringRender,
      queue,
      action
    ) {
      null === ReactSharedInternals.T &&
        0 === currentEntangledLane &&
        console.error(
          "An optimistic state update occurred outside a transition or action. To fix, move the update to an action, or wrap with startTransition."
        );
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
        if (throwIfDuringRender)
          throw Error("Cannot update optimistic state while rendering.");
        console.error("Cannot call startTransition while rendering.");
      } else
        (throwIfDuringRender = enqueueConcurrentHookUpdate(
          fiber,
          queue,
          action,
          2
        )),
          null !== throwIfDuringRender &&
            (startUpdateTimerByLane(2, "setOptimistic()", fiber),
            scheduleUpdateOnFiber(throwIfDuringRender, fiber, 2));
      enableSchedulingProfiler && markStateUpdateScheduled(fiber, 2);
    }
    function isRenderPhaseUpdate(fiber) {
      var alternate = fiber.alternate;
      return (
        fiber === currentlyRenderingFiber ||
        (null !== alternate && alternate === currentlyRenderingFiber)
      );
    }
    function enqueueRenderPhaseUpdate(queue, update) {
      didScheduleRenderPhaseUpdateDuringThisPass =
        didScheduleRenderPhaseUpdate = !0;
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
    function warnOnInvalidCallback(callback) {
      if (null !== callback && "function" !== typeof callback) {
        var key = String(callback);
        didWarnOnInvalidCallback.has(key) ||
          (didWarnOnInvalidCallback.add(key),
          console.error(
            "Expected the last optional `callback` argument to be a function. Instead received: %s.",
            callback
          ));
      }
    }
    function applyDerivedStateFromProps(
      workInProgress,
      ctor,
      getDerivedStateFromProps,
      nextProps
    ) {
      var prevState = workInProgress.memoizedState,
        partialState = getDerivedStateFromProps(nextProps, prevState);
      if (workInProgress.mode & 8) {
        setIsStrictModeForDevtools(!0);
        try {
          partialState = getDerivedStateFromProps(nextProps, prevState);
        } finally {
          setIsStrictModeForDevtools(!1);
        }
      }
      void 0 === partialState &&
        ((ctor = getComponentNameFromType(ctor) || "Component"),
        didWarnAboutUndefinedDerivedState.has(ctor) ||
          (didWarnAboutUndefinedDerivedState.add(ctor),
          console.error(
            "%s.getDerivedStateFromProps(): A valid state object (or null) must be returned. You have returned undefined.",
            ctor
          )));
      prevState =
        null === partialState || void 0 === partialState
          ? prevState
          : assign({}, prevState, partialState);
      workInProgress.memoizedState = prevState;
      0 === workInProgress.lanes &&
        (workInProgress.updateQueue.baseState = prevState);
    }
    function checkShouldComponentUpdate(
      workInProgress,
      ctor,
      oldProps,
      newProps,
      oldState,
      newState,
      nextContext
    ) {
      var instance = workInProgress.stateNode;
      if ("function" === typeof instance.shouldComponentUpdate) {
        oldProps = instance.shouldComponentUpdate(
          newProps,
          newState,
          nextContext
        );
        if (workInProgress.mode & 8) {
          setIsStrictModeForDevtools(!0);
          try {
            oldProps = instance.shouldComponentUpdate(
              newProps,
              newState,
              nextContext
            );
          } finally {
            setIsStrictModeForDevtools(!1);
          }
        }
        void 0 === oldProps &&
          console.error(
            "%s.shouldComponentUpdate(): Returned undefined instead of a boolean value. Make sure to return true or false.",
            getComponentNameFromType(ctor) || "Component"
          );
        return oldProps;
      }
      return ctor.prototype && ctor.prototype.isPureReactComponent
        ? !shallowEqual(oldProps, newProps) || !shallowEqual(oldState, newState)
        : !0;
    }
    function callComponentWillReceiveProps(
      workInProgress,
      instance,
      newProps,
      nextContext
    ) {
      var oldState = instance.state;
      "function" === typeof instance.componentWillReceiveProps &&
        instance.componentWillReceiveProps(newProps, nextContext);
      "function" === typeof instance.UNSAFE_componentWillReceiveProps &&
        instance.UNSAFE_componentWillReceiveProps(newProps, nextContext);
      instance.state !== oldState &&
        ((workInProgress =
          getComponentNameFromFiber(workInProgress) || "Component"),
        didWarnAboutStateAssignmentForComponent.has(workInProgress) ||
          (didWarnAboutStateAssignmentForComponent.add(workInProgress),
          console.error(
            "%s.componentWillReceiveProps(): Assigning directly to this.state is deprecated (except inside a component's constructor). Use setState instead.",
            workInProgress
          )),
        classComponentUpdater.enqueueReplaceState(
          instance,
          instance.state,
          null
        ));
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
        for (var _propName in Component)
          void 0 === newProps[_propName] &&
            (newProps[_propName] = Component[_propName]);
      }
      return newProps;
    }
    function logUncaughtError(root, errorInfo) {
      try {
        componentName = errorInfo.source
          ? getComponentNameFromFiber(errorInfo.source)
          : null;
        errorBoundaryName = null;
        var error = errorInfo.value;
        if (null !== ReactSharedInternals.actQueue)
          ReactSharedInternals.thrownErrors.push(error);
        else {
          var onUncaughtError = root.onUncaughtError;
          onUncaughtError(error, { componentStack: errorInfo.stack });
        }
      } catch (e) {
        setTimeout(function () {
          throw e;
        });
      }
    }
    function logCaughtError(root, boundary, errorInfo) {
      try {
        componentName = errorInfo.source
          ? getComponentNameFromFiber(errorInfo.source)
          : null;
        errorBoundaryName = getComponentNameFromFiber(boundary);
        var onCaughtError = root.onCaughtError;
        onCaughtError(errorInfo.value, {
          componentStack: errorInfo.stack,
          errorBoundary: 1 === boundary.tag ? boundary.stateNode : null
        });
      } catch (e) {
        setTimeout(function () {
          throw e;
        });
      }
    }
    function createRootErrorUpdate(root, errorInfo, lane) {
      lane = createUpdate(lane);
      lane.tag = CaptureUpdate;
      lane.payload = { element: null };
      lane.callback = function () {
        runWithFiberInDEV(errorInfo.source, logUncaughtError, root, errorInfo);
      };
      return lane;
    }
    function createClassErrorUpdate(lane) {
      lane = createUpdate(lane);
      lane.tag = CaptureUpdate;
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
          markFailedErrorBoundaryForHotReloading(fiber);
          runWithFiberInDEV(
            errorInfo.source,
            logCaughtError,
            root,
            fiber,
            errorInfo
          );
        };
      }
      var inst = fiber.stateNode;
      null !== inst &&
        "function" === typeof inst.componentDidCatch &&
        (update.callback = function () {
          markFailedErrorBoundaryForHotReloading(fiber);
          runWithFiberInDEV(
            errorInfo.source,
            logCaughtError,
            root,
            fiber,
            errorInfo
          );
          "function" !== typeof getDerivedStateFromError &&
            (null === legacyErrorBoundariesThatAlreadyFailed
              ? (legacyErrorBoundariesThatAlreadyFailed = new Set([this]))
              : legacyErrorBoundariesThatAlreadyFailed.add(this));
          callComponentDidCatchInDEV(this, errorInfo);
          "function" === typeof getDerivedStateFromError ||
            (0 === (fiber.lanes & 2) &&
              console.error(
                "%s: Error boundaries should implement getDerivedStateFromError(). In that method, return a state update to display an error message or fallback UI.",
                getComponentNameFromFiber(fiber) || "Unknown"
              ));
        });
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
        returnFiber = sourceFiber.alternate;
        null !== returnFiber &&
          propagateParentContextChanges(
            returnFiber,
            sourceFiber,
            rootRenderLanes,
            !0
          );
        isHydrating && (didSuspendOrErrorDEV = !0);
        sourceFiber = suspenseHandlerStackCursor.current;
        if (null !== sourceFiber) {
          switch (sourceFiber.tag) {
            case 31:
            case 13:
              return (
                null === shellBoundary
                  ? renderDidSuspendDelayIfPossible()
                  : null === sourceFiber.alternate &&
                    workInProgressRootExitStatus === RootInProgress &&
                    (workInProgressRootExitStatus = RootSuspended),
                (sourceFiber.flags &= -257),
                (sourceFiber.flags |= 65536),
                (sourceFiber.lanes = rootRenderLanes),
                value === noopSuspenseyCommitThenable
                  ? (sourceFiber.flags |= 16384)
                  : ((returnFiber = sourceFiber.updateQueue),
                    null === returnFiber
                      ? (sourceFiber.updateQueue = new Set([value]))
                      : returnFiber.add(value),
                    attachPingListener(root, value, rootRenderLanes)),
                !1
              );
            case 22:
              return (
                (sourceFiber.flags |= 65536),
                value === noopSuspenseyCommitThenable
                  ? (sourceFiber.flags |= 16384)
                  : ((returnFiber = sourceFiber.updateQueue),
                    null === returnFiber
                      ? ((returnFiber = {
                          transitions: null,
                          markerInstances: null,
                          retryQueue: new Set([value])
                        }),
                        (sourceFiber.updateQueue = returnFiber))
                      : ((sourceFiber = returnFiber.retryQueue),
                        null === sourceFiber
                          ? (returnFiber.retryQueue = new Set([value]))
                          : sourceFiber.add(value)),
                    attachPingListener(root, value, rootRenderLanes)),
                !1
              );
          }
          throw Error(
            "Unexpected Suspense handler tag (" +
              sourceFiber.tag +
              "). This is a bug in React."
          );
        }
        attachPingListener(root, value, rootRenderLanes);
        renderDidSuspendDelayIfPossible();
        return !1;
      }
      if (isHydrating)
        return (
          (didSuspendOrErrorDEV = !0),
          (returnFiber = suspenseHandlerStackCursor.current),
          null !== returnFiber
            ? (0 === (returnFiber.flags & 65536) && (returnFiber.flags |= 256),
              (returnFiber.flags |= 65536),
              (returnFiber.lanes = rootRenderLanes),
              value !== HydrationMismatchException &&
                queueHydrationError(
                  createCapturedValueAtFiber(
                    Error(
                      "There was an error while hydrating but React was able to recover by instead client rendering from the nearest Suspense boundary.",
                      { cause: value }
                    ),
                    sourceFiber
                  )
                ))
            : (value !== HydrationMismatchException &&
                queueHydrationError(
                  createCapturedValueAtFiber(
                    Error(
                      "There was an error while hydrating but React was able to recover by instead client rendering the entire root.",
                      { cause: value }
                    ),
                    sourceFiber
                  )
                ),
              (root = root.current.alternate),
              (root.flags |= 65536),
              (rootRenderLanes &= -rootRenderLanes),
              (root.lanes |= rootRenderLanes),
              (value = createCapturedValueAtFiber(value, sourceFiber)),
              (rootRenderLanes = createRootErrorUpdate(
                root.stateNode,
                value,
                rootRenderLanes
              )),
              enqueueCapturedUpdate(root, rootRenderLanes),
              workInProgressRootExitStatus !== RootSuspendedWithDelay &&
                (workInProgressRootExitStatus = RootErrored)),
          !1
        );
      var error = createCapturedValueAtFiber(
        Error(
          "There was an error during concurrent rendering but React was able to recover by instead synchronously rendering the entire root.",
          { cause: value }
        ),
        sourceFiber
      );
      null === workInProgressRootConcurrentErrors
        ? (workInProgressRootConcurrentErrors = [error])
        : workInProgressRootConcurrentErrors.push(error);
      workInProgressRootExitStatus !== RootSuspendedWithDelay &&
        (workInProgressRootExitStatus = RootErrored);
      if (null === returnFiber) return !0;
      value = createCapturedValueAtFiber(value, sourceFiber);
      sourceFiber = returnFiber;
      do {
        switch (sourceFiber.tag) {
          case 3:
            return (
              (sourceFiber.flags |= 65536),
              (root = rootRenderLanes & -rootRenderLanes),
              (sourceFiber.lanes |= root),
              (root = createRootErrorUpdate(
                sourceFiber.stateNode,
                value,
                root
              )),
              enqueueCapturedUpdate(sourceFiber, root),
              !1
            );
          case 1:
            if (
              ((returnFiber = sourceFiber.type),
              (error = sourceFiber.stateNode),
              0 === (sourceFiber.flags & 128) &&
                ("function" === typeof returnFiber.getDerivedStateFromError ||
                  (null !== error &&
                    "function" === typeof error.componentDidCatch &&
                    (null === legacyErrorBoundariesThatAlreadyFailed ||
                      !legacyErrorBoundariesThatAlreadyFailed.has(error)))))
            )
              return (
                (sourceFiber.flags |= 65536),
                (rootRenderLanes &= -rootRenderLanes),
                (sourceFiber.lanes |= rootRenderLanes),
                (rootRenderLanes = createClassErrorUpdate(rootRenderLanes)),
                initializeClassErrorUpdate(
                  rootRenderLanes,
                  root,
                  sourceFiber,
                  value
                ),
                enqueueCapturedUpdate(sourceFiber, rootRenderLanes),
                !1
              );
        }
        sourceFiber = sourceFiber.return;
      } while (null !== sourceFiber);
      return !1;
    }
    function processTransitionCallbacks(
      pendingTransitions,
      endTime,
      callbacks
    ) {
      if (enableTransitionTracing && null !== pendingTransitions) {
        var transitionStart = pendingTransitions.transitionStart,
          onTransitionStart = callbacks.onTransitionStart;
        null !== transitionStart &&
          null != onTransitionStart &&
          transitionStart.forEach(function (transition) {
            null != transition.name &&
              onTransitionStart(transition.name, transition.startTime);
          });
        transitionStart = pendingTransitions.markerProgress;
        var onMarkerProgress = callbacks.onMarkerProgress;
        null != onMarkerProgress &&
          null !== transitionStart &&
          transitionStart.forEach(function (markerInstance, markerName) {
            if (null !== markerInstance.transitions) {
              var pending =
                null !== markerInstance.pendingBoundaries
                  ? Array.from(markerInstance.pendingBoundaries.values())
                  : [];
              markerInstance.transitions.forEach(function (transition) {
                null != transition.name &&
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
          transitionStart.forEach(function (transitions, markerName) {
            transitions.forEach(function (transition) {
              null != transition.name &&
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
          transitionStart.forEach(function (_ref, markerName) {
            var aborts = _ref.aborts;
            _ref.transitions.forEach(function (transition) {
              var filteredAborts = [];
              aborts.forEach(function (abort) {
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
                null != transition.name &&
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
          transitionStart.forEach(function (pending, transition) {
            null != transition.name &&
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
          pendingTransitions.forEach(function (transition) {
            null != transition.name &&
              onTransitionComplete(
                transition.name,
                transition.startTime,
                endTime
              );
          });
      }
    }
    function pushRootMarkerInstance(workInProgress) {
      if (enableTransitionTracing) {
        var transitions = workInProgressTransitions,
          root = workInProgress.stateNode;
        null !== transitions &&
          transitions.forEach(function (transition) {
            if (!root.incompleteTransitions.has(transition)) {
              var markerInstance = {
                tag: TransitionRoot,
                transitions: new Set([transition]),
                pendingBoundaries: null,
                aborts: null,
                name: null
              };
              root.incompleteTransitions.set(transition, markerInstance);
            }
          });
        var markerInstances = [];
        root.incompleteTransitions.forEach(function (markerInstance) {
          markerInstances.push(markerInstance);
        });
        push(markerInstanceStack, markerInstances, workInProgress);
      }
    }
    function pushMarkerInstance(workInProgress, markerInstance) {
      enableTransitionTracing &&
        (null === markerInstanceStack.current
          ? push(markerInstanceStack, [markerInstance], workInProgress)
          : push(
              markerInstanceStack,
              markerInstanceStack.current.concat(markerInstance),
              workInProgress
            ));
    }
    function reconcileChildren(
      current,
      workInProgress,
      nextChildren,
      renderLanes
    ) {
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
      enableSchedulingProfiler && markComponentRenderStarted(workInProgress);
      nextProps = renderWithHooks(
        current,
        workInProgress,
        Component,
        propsWithoutRef,
        ref,
        renderLanes
      );
      key = checkDidRenderIdHook();
      enableSchedulingProfiler && markComponentRenderStopped();
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
            (Component = resolveFunctionForHotReloading(type)),
            (workInProgress.tag = 15),
            (workInProgress.type = Component),
            validateFunctionComponentInDev(workInProgress, type),
            updateSimpleMemoComponent(
              current,
              workInProgress,
              Component,
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
        if (
          Component(prevProps, nextProps) &&
          current.ref === workInProgress.ref
        )
          return bailoutOnAlreadyFinishedWork(
            current,
            workInProgress,
            renderLanes
          );
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
          current.ref === workInProgress.ref &&
          workInProgress.type === current.type
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
          _visibility: OffscreenVisible,
          _pendingMarkers: null,
          _retryCache: null,
          _transitions: null
        });
      if (
        "hidden" === nextProps.mode ||
        "unstable-defer-without-hiding" === nextProps.mode
      ) {
        if (0 !== (workInProgress.flags & 128)) {
          prevState =
            null !== prevState
              ? prevState.baseLanes | renderLanes
              : renderLanes;
          if (null !== current) {
            nextChildren = workInProgress.child = current.child;
            for (nextProps = 0; null !== nextChildren; )
              (nextProps =
                nextProps | nextChildren.lanes | nextChildren.childLanes),
                (nextChildren = nextChildren.sibling);
            nextChildren = nextProps & ~prevState;
          } else (nextChildren = 0), (workInProgress.child = null);
          return deferHiddenOffscreenComponent(
            current,
            workInProgress,
            prevState,
            renderLanes,
            nextChildren
          );
        }
        if (0 !== (renderLanes & 536870912))
          (workInProgress.memoizedState = { baseLanes: 0, cachePool: null }),
            null !== current &&
              pushTransition(
                workInProgress,
                null !== prevState ? prevState.cachePool : null,
                null
              ),
            null !== prevState
              ? pushHiddenContext(workInProgress, prevState)
              : reuseHiddenContextOnStack(workInProgress),
            pushOffscreenSuspenseHandler(workInProgress);
        else
          return (
            (nextChildren = workInProgress.lanes = 536870912),
            deferHiddenOffscreenComponent(
              current,
              workInProgress,
              null !== prevState
                ? prevState.baseLanes | renderLanes
                : renderLanes,
              renderLanes,
              nextChildren
            )
          );
      } else if (null !== prevState) {
        nextProps = prevState.cachePool;
        var transitions = null;
        if (enableTransitionTracing) {
          var instance = workInProgress.stateNode;
          null !== instance &&
            null != instance._transitions &&
            (transitions = Array.from(instance._transitions));
        }
        pushTransition(workInProgress, nextProps, transitions);
        pushHiddenContext(workInProgress, prevState);
        reuseSuspenseHandlerOnStack(workInProgress);
        workInProgress.memoizedState = null;
      } else
        null !== current && pushTransition(workInProgress, null, null),
          reuseHiddenContextOnStack(workInProgress),
          reuseSuspenseHandlerOnStack(workInProgress);
      reconcileChildren(current, workInProgress, nextChildren, renderLanes);
      return workInProgress.child;
    }
    function bailoutOffscreenComponent(current, workInProgress) {
      (null !== current && 22 === current.tag) ||
        null !== workInProgress.stateNode ||
        (workInProgress.stateNode = {
          _visibility: OffscreenVisible,
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
          : {
              parent: isPrimaryRenderer
                ? CacheContext._currentValue
                : CacheContext._currentValue2,
              pool: JSCompiler_inline_result
            };
      workInProgress.memoizedState = {
        baseLanes: nextBaseLanes,
        cachePool: JSCompiler_inline_result
      };
      null !== current && pushTransition(workInProgress, null, null);
      reuseHiddenContextOnStack(workInProgress);
      pushOffscreenSuspenseHandler(workInProgress);
      null !== current &&
        propagateParentContextChanges(current, workInProgress, renderLanes, !0);
      workInProgress.childLanes = remainingChildLanes;
      return null;
    }
    function mountActivityChildren(workInProgress, nextProps) {
      var hiddenProp = nextProps.hidden;
      void 0 !== hiddenProp &&
        console.error(
          '<Activity> doesn\'t accept a hidden prop. Use mode="hidden" instead.\n- <Activity %s>\n+ <Activity %s>',
          !0 === hiddenProp
            ? "hidden"
            : !1 === hiddenProp
              ? "hidden={false}"
              : "hidden={...}",
          hiddenProp ? 'mode="hidden"' : 'mode="visible"'
        );
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
      current = mountActivityChildren(
        workInProgress,
        workInProgress.pendingProps
      );
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
            ? ((renderLanes = canHydrateActivityInstance(
                current,
                rootOrSingletonContext
              )),
              null !== renderLanes &&
                ((nextProps = {
                  dehydrated: renderLanes,
                  treeContext: getSuspendedTreeContext(),
                  retryLane: 536870912,
                  hydrationErrors: null
                }),
                (workInProgress.memoizedState = nextProps),
                (nextProps = createFiberFromDehydratedFragment(renderLanes)),
                (nextProps.return = workInProgress),
                (workInProgress.child = nextProps),
                (hydrationParentFiber = workInProgress),
                (nextHydratableInstance = null)))
            : (renderLanes = null);
          if (null === renderLanes)
            throw (
              (warnNonHydratedInstance(workInProgress, current),
              throwOnHydrationMismatch(workInProgress))
            );
          workInProgress.lanes = 536870912;
          return null;
        }
        return mountActivityChildren(workInProgress, nextProps);
      }
      var prevState = current.memoizedState;
      if (null !== prevState) {
        var activityInstance = prevState.dehydrated;
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
          else
            throw Error(
              "Client rendering an Activity suspended it again. This is a bug in React."
            );
        else if (
          (warnIfHydrating(),
          0 !== (renderLanes & 536870912) &&
            markRenderDerivedCause(workInProgress),
          didReceiveUpdate ||
            propagateParentContextChanges(
              current,
              workInProgress,
              renderLanes,
              !1
            ),
          (didSuspend = 0 !== (renderLanes & current.childLanes)),
          didReceiveUpdate || didSuspend)
        ) {
          nextProps = workInProgressRoot;
          if (
            null !== nextProps &&
            ((activityInstance = getBumpedLaneForHydration(
              nextProps,
              renderLanes
            )),
            0 !== activityInstance && activityInstance !== prevState.retryLane)
          )
            throw (
              ((prevState.retryLane = activityInstance),
              enqueueConcurrentRenderForLane(current, activityInstance),
              scheduleUpdateOnFiber(nextProps, current, activityInstance),
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
            supportsHydration &&
              ((nextHydratableInstance =
                getFirstHydratableChildWithinActivityInstance(
                  activityInstance
                )),
              (hydrationParentFiber = workInProgress),
              (isHydrating = !0),
              (hydrationErrors = null),
              (didSuspendOrErrorDEV = !1),
              (hydrationDiffRootDEV = null),
              (rootOrSingletonContext = !1),
              null !== current &&
                restoreSuspendedTreeContext(workInProgress, current)),
            (workInProgress = mountActivityChildren(workInProgress, nextProps)),
            (workInProgress.flags |= 4096);
        return workInProgress;
      }
      prevState = current.child;
      nextProps = { mode: nextProps.mode, children: nextProps.children };
      0 !== (renderLanes & 536870912) &&
        0 !== (renderLanes & current.lanes) &&
        markRenderDerivedCause(workInProgress);
      current = createWorkInProgress(prevState, nextProps);
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
          throw Error(
            "Expected ref to be a function, an object returned by React.createRef(), or undefined/null."
          );
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
      if (
        Component.prototype &&
        "function" === typeof Component.prototype.render
      ) {
        var componentName = getComponentNameFromType(Component) || "Unknown";
        didWarnAboutBadClass[componentName] ||
          (console.error(
            "The <%s /> component appears to have a render method, but doesn't extend React.Component. This is likely to cause errors. Change %s to extend React.Component instead.",
            componentName,
            componentName
          ),
          (didWarnAboutBadClass[componentName] = !0));
      }
      workInProgress.mode & 8 &&
        ReactStrictModeWarnings.recordLegacyContextWarning(
          workInProgress,
          null
        );
      null === current &&
        (validateFunctionComponentInDev(workInProgress, workInProgress.type),
        Component.contextTypes &&
          ((componentName = getComponentNameFromType(Component) || "Unknown"),
          didWarnAboutContextTypes[componentName] ||
            ((didWarnAboutContextTypes[componentName] = !0),
            console.error(
              "%s uses the legacy contextTypes API which was removed in React 19. Use React.createContext() with React.useContext() instead. (https://react.dev/link/legacy-context)",
              componentName
            ))));
      prepareToReadContext(workInProgress);
      enableSchedulingProfiler && markComponentRenderStarted(workInProgress);
      Component = renderWithHooks(
        current,
        workInProgress,
        Component,
        nextProps,
        void 0,
        renderLanes
      );
      nextProps = checkDidRenderIdHook();
      enableSchedulingProfiler && markComponentRenderStopped();
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
      enableSchedulingProfiler && markComponentRenderStarted(workInProgress);
      hookTypesUpdateIndexDev = -1;
      ignorePreviousDependencies =
        null !== current && current.type !== workInProgress.type;
      workInProgress.updateQueue = null;
      nextProps = renderWithHooksAgain(
        workInProgress,
        Component,
        nextProps,
        secondArg
      );
      finishRenderingHooks(current, workInProgress);
      Component = checkDidRenderIdHook();
      enableSchedulingProfiler && markComponentRenderStopped();
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
      switch (shouldErrorImpl(workInProgress)) {
        case !1:
          var _instance = workInProgress.stateNode,
            state = new workInProgress.type(
              workInProgress.memoizedProps,
              _instance.context
            ).state;
          _instance.updater.enqueueSetState(_instance, state, null);
          break;
        case !0:
          workInProgress.flags |= 128;
          workInProgress.flags |= 65536;
          _instance = Error("Simulated error coming from DevTools");
          var lane = renderLanes & -renderLanes;
          workInProgress.lanes |= lane;
          state = workInProgressRoot;
          if (null === state)
            throw Error(
              "Expected a work-in-progress root. This is a bug in React. Please file an issue."
            );
          lane = createClassErrorUpdate(lane);
          initializeClassErrorUpdate(
            lane,
            state,
            workInProgress,
            createCapturedValueAtFiber(_instance, workInProgress)
          );
          enqueueCapturedUpdate(workInProgress, lane);
      }
      prepareToReadContext(workInProgress);
      if (null === workInProgress.stateNode) {
        state = emptyContextObject;
        _instance = Component.contextType;
        "contextType" in Component &&
          null !== _instance &&
          (void 0 === _instance || _instance.$$typeof !== REACT_CONTEXT_TYPE) &&
          !didWarnAboutInvalidateContextType.has(Component) &&
          (didWarnAboutInvalidateContextType.add(Component),
          (lane =
            void 0 === _instance
              ? " However, it is set to undefined. This can be caused by a typo or by mixing up named and default imports. This can also happen due to a circular dependency, so try moving the createContext() call to a separate file."
              : "object" !== typeof _instance
                ? " However, it is set to a " + typeof _instance + "."
                : _instance.$$typeof === REACT_CONSUMER_TYPE
                  ? " Did you accidentally pass the Context.Consumer instead?"
                  : " However, it is set to an object with keys {" +
                    Object.keys(_instance).join(", ") +
                    "}."),
          console.error(
            "%s defines an invalid contextType. contextType should point to the Context object returned by React.createContext().%s",
            getComponentNameFromType(Component) || "Component",
            lane
          ));
        "object" === typeof _instance &&
          null !== _instance &&
          (state = readContext(_instance));
        _instance = new Component(nextProps, state);
        if (workInProgress.mode & 8) {
          setIsStrictModeForDevtools(!0);
          try {
            _instance = new Component(nextProps, state);
          } finally {
            setIsStrictModeForDevtools(!1);
          }
        }
        state = workInProgress.memoizedState =
          null !== _instance.state && void 0 !== _instance.state
            ? _instance.state
            : null;
        _instance.updater = classComponentUpdater;
        workInProgress.stateNode = _instance;
        _instance._reactInternals = workInProgress;
        _instance._reactInternalInstance = fakeInternalInstance;
        "function" === typeof Component.getDerivedStateFromProps &&
          null === state &&
          ((state = getComponentNameFromType(Component) || "Component"),
          didWarnAboutUninitializedState.has(state) ||
            (didWarnAboutUninitializedState.add(state),
            console.error(
              "`%s` uses `getDerivedStateFromProps` but its initial state is %s. This is not recommended. Instead, define the initial state by assigning an object to `this.state` in the constructor of `%s`. This ensures that `getDerivedStateFromProps` arguments have a consistent shape.",
              state,
              null === _instance.state ? "null" : "undefined",
              state
            )));
        if (
          "function" === typeof Component.getDerivedStateFromProps ||
          "function" === typeof _instance.getSnapshotBeforeUpdate
        ) {
          var foundWillUpdateName = (lane = state = null);
          "function" === typeof _instance.componentWillMount &&
          !0 !== _instance.componentWillMount.__suppressDeprecationWarning
            ? (state = "componentWillMount")
            : "function" === typeof _instance.UNSAFE_componentWillMount &&
              (state = "UNSAFE_componentWillMount");
          "function" === typeof _instance.componentWillReceiveProps &&
          !0 !==
            _instance.componentWillReceiveProps.__suppressDeprecationWarning
            ? (lane = "componentWillReceiveProps")
            : "function" ===
                typeof _instance.UNSAFE_componentWillReceiveProps &&
              (lane = "UNSAFE_componentWillReceiveProps");
          "function" === typeof _instance.componentWillUpdate &&
          !0 !== _instance.componentWillUpdate.__suppressDeprecationWarning
            ? (foundWillUpdateName = "componentWillUpdate")
            : "function" === typeof _instance.UNSAFE_componentWillUpdate &&
              (foundWillUpdateName = "UNSAFE_componentWillUpdate");
          if (null !== state || null !== lane || null !== foundWillUpdateName) {
            _instance = getComponentNameFromType(Component) || "Component";
            var newApiName =
              "function" === typeof Component.getDerivedStateFromProps
                ? "getDerivedStateFromProps()"
                : "getSnapshotBeforeUpdate()";
            didWarnAboutLegacyLifecyclesAndDerivedState.has(_instance) ||
              (didWarnAboutLegacyLifecyclesAndDerivedState.add(_instance),
              console.error(
                "Unsafe legacy lifecycles will not be called for components using new component APIs.\n\n%s uses %s but also contains the following legacy lifecycles:%s%s%s\n\nThe above lifecycles should be removed. Learn more about this warning here:\nhttps://react.dev/link/unsafe-component-lifecycles",
                _instance,
                newApiName,
                null !== state ? "\n  " + state : "",
                null !== lane ? "\n  " + lane : "",
                null !== foundWillUpdateName ? "\n  " + foundWillUpdateName : ""
              ));
          }
        }
        _instance = workInProgress.stateNode;
        state = getComponentNameFromType(Component) || "Component";
        _instance.render ||
          (Component.prototype &&
          "function" === typeof Component.prototype.render
            ? console.error(
                "No `render` method found on the %s instance: did you accidentally return an object from the constructor?",
                state
              )
            : console.error(
                "No `render` method found on the %s instance: you may have forgotten to define `render`.",
                state
              ));
        !_instance.getInitialState ||
          _instance.getInitialState.isReactClassApproved ||
          _instance.state ||
          console.error(
            "getInitialState was defined on %s, a plain JavaScript class. This is only supported for classes created using React.createClass. Did you mean to define a state property instead?",
            state
          );
        _instance.getDefaultProps &&
          !_instance.getDefaultProps.isReactClassApproved &&
          console.error(
            "getDefaultProps was defined on %s, a plain JavaScript class. This is only supported for classes created using React.createClass. Use a static property to define defaultProps instead.",
            state
          );
        _instance.contextType &&
          console.error(
            "contextType was defined as an instance property on %s. Use a static property to define contextType instead.",
            state
          );
        Component.childContextTypes &&
          !didWarnAboutChildContextTypes.has(Component) &&
          (didWarnAboutChildContextTypes.add(Component),
          console.error(
            "%s uses the legacy childContextTypes API which was removed in React 19. Use React.createContext() instead. (https://react.dev/link/legacy-context)",
            state
          ));
        Component.contextTypes &&
          !didWarnAboutContextTypes$1.has(Component) &&
          (didWarnAboutContextTypes$1.add(Component),
          console.error(
            "%s uses the legacy contextTypes API which was removed in React 19. Use React.createContext() with static contextType instead. (https://react.dev/link/legacy-context)",
            state
          ));
        "function" === typeof _instance.componentShouldUpdate &&
          console.error(
            "%s has a method called componentShouldUpdate(). Did you mean shouldComponentUpdate()? The name is phrased as a question because the function is expected to return a value.",
            state
          );
        Component.prototype &&
          Component.prototype.isPureReactComponent &&
          "undefined" !== typeof _instance.shouldComponentUpdate &&
          console.error(
            "%s has a method called shouldComponentUpdate(). shouldComponentUpdate should not be used when extending React.PureComponent. Please extend React.Component if shouldComponentUpdate is used.",
            getComponentNameFromType(Component) || "A pure component"
          );
        "function" === typeof _instance.componentDidUnmount &&
          console.error(
            "%s has a method called componentDidUnmount(). But there is no such lifecycle method. Did you mean componentWillUnmount()?",
            state
          );
        "function" === typeof _instance.componentDidReceiveProps &&
          console.error(
            "%s has a method called componentDidReceiveProps(). But there is no such lifecycle method. If you meant to update the state in response to changing props, use componentWillReceiveProps(). If you meant to fetch data or run side-effects or mutations after React has updated the UI, use componentDidUpdate().",
            state
          );
        "function" === typeof _instance.componentWillRecieveProps &&
          console.error(
            "%s has a method called componentWillRecieveProps(). Did you mean componentWillReceiveProps()?",
            state
          );
        "function" === typeof _instance.UNSAFE_componentWillRecieveProps &&
          console.error(
            "%s has a method called UNSAFE_componentWillRecieveProps(). Did you mean UNSAFE_componentWillReceiveProps()?",
            state
          );
        lane = _instance.props !== nextProps;
        void 0 !== _instance.props &&
          lane &&
          console.error(
            "When calling super() in `%s`, make sure to pass up the same props that your component's constructor was passed.",
            state
          );
        _instance.defaultProps &&
          console.error(
            "Setting defaultProps as an instance property on %s is not supported and will be ignored. Instead, define defaultProps as a static property on %s.",
            state,
            state
          );
        "function" !== typeof _instance.getSnapshotBeforeUpdate ||
          "function" === typeof _instance.componentDidUpdate ||
          didWarnAboutGetSnapshotBeforeUpdateWithoutDidUpdate.has(Component) ||
          (didWarnAboutGetSnapshotBeforeUpdateWithoutDidUpdate.add(Component),
          console.error(
            "%s: getSnapshotBeforeUpdate() should be used with componentDidUpdate(). This component defines getSnapshotBeforeUpdate() only.",
            getComponentNameFromType(Component)
          ));
        "function" === typeof _instance.getDerivedStateFromProps &&
          console.error(
            "%s: getDerivedStateFromProps() is defined as an instance method and will be ignored. Instead, declare it as a static method.",
            state
          );
        "function" === typeof _instance.getDerivedStateFromError &&
          console.error(
            "%s: getDerivedStateFromError() is defined as an instance method and will be ignored. Instead, declare it as a static method.",
            state
          );
        "function" === typeof Component.getSnapshotBeforeUpdate &&
          console.error(
            "%s: getSnapshotBeforeUpdate() is defined as a static method and will be ignored. Instead, declare it as an instance method.",
            state
          );
        (lane = _instance.state) &&
          ("object" !== typeof lane || isArrayImpl(lane)) &&
          console.error("%s.state: must be set to an object or null", state);
        "function" === typeof _instance.getChildContext &&
          "object" !== typeof Component.childContextTypes &&
          console.error(
            "%s.getChildContext(): childContextTypes must be defined in order to use getChildContext().",
            state
          );
        _instance = workInProgress.stateNode;
        _instance.props = nextProps;
        _instance.state = workInProgress.memoizedState;
        _instance.refs = {};
        initializeUpdateQueue(workInProgress);
        state = Component.contextType;
        _instance.context =
          "object" === typeof state && null !== state
            ? readContext(state)
            : emptyContextObject;
        _instance.state === nextProps &&
          ((state = getComponentNameFromType(Component) || "Component"),
          didWarnAboutDirectlyAssigningPropsToState.has(state) ||
            (didWarnAboutDirectlyAssigningPropsToState.add(state),
            console.error(
              "%s: It is not recommended to assign props directly to state because updates to props won't be reflected in state. In most cases, it is better to use props directly.",
              state
            )));
        workInProgress.mode & 8 &&
          ReactStrictModeWarnings.recordLegacyContextWarning(
            workInProgress,
            _instance
          );
        ReactStrictModeWarnings.recordUnsafeLifecycleWarnings(
          workInProgress,
          _instance
        );
        _instance.state = workInProgress.memoizedState;
        state = Component.getDerivedStateFromProps;
        "function" === typeof state &&
          (applyDerivedStateFromProps(
            workInProgress,
            Component,
            state,
            nextProps
          ),
          (_instance.state = workInProgress.memoizedState));
        "function" === typeof Component.getDerivedStateFromProps ||
          "function" === typeof _instance.getSnapshotBeforeUpdate ||
          ("function" !== typeof _instance.UNSAFE_componentWillMount &&
            "function" !== typeof _instance.componentWillMount) ||
          ((state = _instance.state),
          "function" === typeof _instance.componentWillMount &&
            _instance.componentWillMount(),
          "function" === typeof _instance.UNSAFE_componentWillMount &&
            _instance.UNSAFE_componentWillMount(),
          state !== _instance.state &&
            (console.error(
              "%s.componentWillMount(): Assigning directly to this.state is deprecated (except inside a component's constructor). Use setState instead.",
              getComponentNameFromFiber(workInProgress) || "Component"
            ),
            classComponentUpdater.enqueueReplaceState(
              _instance,
              _instance.state,
              null
            )),
          processUpdateQueue(workInProgress, nextProps, _instance, renderLanes),
          suspendIfUpdateReadFromEntangledAsyncAction(),
          (_instance.state = workInProgress.memoizedState));
        "function" === typeof _instance.componentDidMount &&
          (workInProgress.flags |= 4194308);
        (workInProgress.mode & 16) !== NoMode &&
          (workInProgress.flags |= 134217728);
        _instance = !0;
      } else if (null === current) {
        _instance = workInProgress.stateNode;
        var unresolvedOldProps = workInProgress.memoizedProps;
        lane = resolveClassComponentProps(Component, unresolvedOldProps);
        _instance.props = lane;
        var oldContext = _instance.context;
        foundWillUpdateName = Component.contextType;
        state = emptyContextObject;
        "object" === typeof foundWillUpdateName &&
          null !== foundWillUpdateName &&
          (state = readContext(foundWillUpdateName));
        newApiName = Component.getDerivedStateFromProps;
        foundWillUpdateName =
          "function" === typeof newApiName ||
          "function" === typeof _instance.getSnapshotBeforeUpdate;
        unresolvedOldProps = workInProgress.pendingProps !== unresolvedOldProps;
        foundWillUpdateName ||
          ("function" !== typeof _instance.UNSAFE_componentWillReceiveProps &&
            "function" !== typeof _instance.componentWillReceiveProps) ||
          ((unresolvedOldProps || oldContext !== state) &&
            callComponentWillReceiveProps(
              workInProgress,
              _instance,
              nextProps,
              state
            ));
        hasForceUpdate = !1;
        var oldState = workInProgress.memoizedState;
        _instance.state = oldState;
        processUpdateQueue(workInProgress, nextProps, _instance, renderLanes);
        suspendIfUpdateReadFromEntangledAsyncAction();
        oldContext = workInProgress.memoizedState;
        unresolvedOldProps || oldState !== oldContext || hasForceUpdate
          ? ("function" === typeof newApiName &&
              (applyDerivedStateFromProps(
                workInProgress,
                Component,
                newApiName,
                nextProps
              ),
              (oldContext = workInProgress.memoizedState)),
            (lane =
              hasForceUpdate ||
              checkShouldComponentUpdate(
                workInProgress,
                Component,
                lane,
                nextProps,
                oldState,
                oldContext,
                state
              ))
              ? (foundWillUpdateName ||
                  ("function" !== typeof _instance.UNSAFE_componentWillMount &&
                    "function" !== typeof _instance.componentWillMount) ||
                  ("function" === typeof _instance.componentWillMount &&
                    _instance.componentWillMount(),
                  "function" === typeof _instance.UNSAFE_componentWillMount &&
                    _instance.UNSAFE_componentWillMount()),
                "function" === typeof _instance.componentDidMount &&
                  (workInProgress.flags |= 4194308),
                (workInProgress.mode & 16) !== NoMode &&
                  (workInProgress.flags |= 134217728))
              : ("function" === typeof _instance.componentDidMount &&
                  (workInProgress.flags |= 4194308),
                (workInProgress.mode & 16) !== NoMode &&
                  (workInProgress.flags |= 134217728),
                (workInProgress.memoizedProps = nextProps),
                (workInProgress.memoizedState = oldContext)),
            (_instance.props = nextProps),
            (_instance.state = oldContext),
            (_instance.context = state),
            (_instance = lane))
          : ("function" === typeof _instance.componentDidMount &&
              (workInProgress.flags |= 4194308),
            (workInProgress.mode & 16) !== NoMode &&
              (workInProgress.flags |= 134217728),
            (_instance = !1));
      } else {
        _instance = workInProgress.stateNode;
        cloneUpdateQueue(current, workInProgress);
        state = workInProgress.memoizedProps;
        foundWillUpdateName = resolveClassComponentProps(Component, state);
        _instance.props = foundWillUpdateName;
        newApiName = workInProgress.pendingProps;
        oldState = _instance.context;
        oldContext = Component.contextType;
        lane = emptyContextObject;
        "object" === typeof oldContext &&
          null !== oldContext &&
          (lane = readContext(oldContext));
        unresolvedOldProps = Component.getDerivedStateFromProps;
        (oldContext =
          "function" === typeof unresolvedOldProps ||
          "function" === typeof _instance.getSnapshotBeforeUpdate) ||
          ("function" !== typeof _instance.UNSAFE_componentWillReceiveProps &&
            "function" !== typeof _instance.componentWillReceiveProps) ||
          ((state !== newApiName || oldState !== lane) &&
            callComponentWillReceiveProps(
              workInProgress,
              _instance,
              nextProps,
              lane
            ));
        hasForceUpdate = !1;
        oldState = workInProgress.memoizedState;
        _instance.state = oldState;
        processUpdateQueue(workInProgress, nextProps, _instance, renderLanes);
        suspendIfUpdateReadFromEntangledAsyncAction();
        var newState = workInProgress.memoizedState;
        state !== newApiName ||
        oldState !== newState ||
        hasForceUpdate ||
        (null !== current &&
          null !== current.dependencies &&
          checkIfContextChanged(current.dependencies))
          ? ("function" === typeof unresolvedOldProps &&
              (applyDerivedStateFromProps(
                workInProgress,
                Component,
                unresolvedOldProps,
                nextProps
              ),
              (newState = workInProgress.memoizedState)),
            (foundWillUpdateName =
              hasForceUpdate ||
              checkShouldComponentUpdate(
                workInProgress,
                Component,
                foundWillUpdateName,
                nextProps,
                oldState,
                newState,
                lane
              ) ||
              (null !== current &&
                null !== current.dependencies &&
                checkIfContextChanged(current.dependencies)))
              ? (oldContext ||
                  ("function" !== typeof _instance.UNSAFE_componentWillUpdate &&
                    "function" !== typeof _instance.componentWillUpdate) ||
                  ("function" === typeof _instance.componentWillUpdate &&
                    _instance.componentWillUpdate(nextProps, newState, lane),
                  "function" === typeof _instance.UNSAFE_componentWillUpdate &&
                    _instance.UNSAFE_componentWillUpdate(
                      nextProps,
                      newState,
                      lane
                    )),
                "function" === typeof _instance.componentDidUpdate &&
                  (workInProgress.flags |= 4),
                "function" === typeof _instance.getSnapshotBeforeUpdate &&
                  (workInProgress.flags |= 1024))
              : ("function" !== typeof _instance.componentDidUpdate ||
                  (state === current.memoizedProps &&
                    oldState === current.memoizedState) ||
                  (workInProgress.flags |= 4),
                "function" !== typeof _instance.getSnapshotBeforeUpdate ||
                  (state === current.memoizedProps &&
                    oldState === current.memoizedState) ||
                  (workInProgress.flags |= 1024),
                (workInProgress.memoizedProps = nextProps),
                (workInProgress.memoizedState = newState)),
            (_instance.props = nextProps),
            (_instance.state = newState),
            (_instance.context = lane),
            (_instance = foundWillUpdateName))
          : ("function" !== typeof _instance.componentDidUpdate ||
              (state === current.memoizedProps &&
                oldState === current.memoizedState) ||
              (workInProgress.flags |= 4),
            "function" !== typeof _instance.getSnapshotBeforeUpdate ||
              (state === current.memoizedProps &&
                oldState === current.memoizedState) ||
              (workInProgress.flags |= 1024),
            (_instance = !1));
      }
      lane = _instance;
      markRef(current, workInProgress);
      state = 0 !== (workInProgress.flags & 128);
      if (lane || state) {
        lane = workInProgress.stateNode;
        setCurrentFiber(workInProgress);
        if (state && "function" !== typeof Component.getDerivedStateFromError)
          (Component = null), (profilerStartTime = -1);
        else {
          enableSchedulingProfiler &&
            markComponentRenderStarted(workInProgress);
          Component = callRenderInDEV(lane);
          if (workInProgress.mode & 8) {
            setIsStrictModeForDevtools(!0);
            try {
              callRenderInDEV(lane);
            } finally {
              setIsStrictModeForDevtools(!1);
            }
          }
          enableSchedulingProfiler && markComponentRenderStopped();
        }
        workInProgress.flags |= 1;
        null !== current && state
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
        workInProgress.memoizedState = lane.state;
        current = workInProgress.child;
      } else
        current = bailoutOnAlreadyFinishedWork(
          current,
          workInProgress,
          renderLanes
        );
      renderLanes = workInProgress.stateNode;
      _instance &&
        renderLanes.props !== nextProps &&
        (didWarnAboutReassigningProps ||
          console.error(
            "It looks like %s is reassigning its own `this.props` while rendering. This is not supported and can lead to confusing bugs.",
            getComponentNameFromFiber(workInProgress) || "a component"
          ),
        (didWarnAboutReassigningProps = !0));
      return current;
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
    function validateFunctionComponentInDev(workInProgress, Component) {
      Component &&
        Component.childContextTypes &&
        console.error(
          "childContextTypes cannot be defined on a function component.\n  %s.childContextTypes = ...",
          Component.displayName || Component.name || "Component"
        );
      "function" === typeof Component.getDerivedStateFromProps &&
        ((workInProgress = getComponentNameFromType(Component) || "Unknown"),
        didWarnAboutGetDerivedStateOnFunctionComponent[workInProgress] ||
          (console.error(
            "%s: Function components do not support getDerivedStateFromProps.",
            workInProgress
          ),
          (didWarnAboutGetDerivedStateOnFunctionComponent[workInProgress] =
            !0)));
      "object" === typeof Component.contextType &&
        null !== Component.contextType &&
        ((Component = getComponentNameFromType(Component) || "Unknown"),
        didWarnAboutContextTypeOnFunctionComponent[Component] ||
          (console.error(
            "%s: Function components do not support contextType.",
            Component
          ),
          (didWarnAboutContextTypeOnFunctionComponent[Component] = !0)));
    }
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
      var nextProps = workInProgress.pendingProps;
      shouldSuspendImpl(workInProgress) && (workInProgress.flags |= 128);
      var showFallback = !1,
        didSuspend = 0 !== (workInProgress.flags & 128),
        JSCompiler_temp;
      (JSCompiler_temp = didSuspend) ||
        (JSCompiler_temp =
          null !== current && null === current.memoizedState
            ? !1
            : 0 !== (suspenseStackCursor.current & ForceSuspenseFallback));
      JSCompiler_temp && ((showFallback = !0), (workInProgress.flags &= -129));
      JSCompiler_temp = 0 !== (workInProgress.flags & 32);
      workInProgress.flags &= -33;
      if (null === current) {
        if (isHydrating) {
          showFallback
            ? pushPrimaryTreeSuspenseHandler(workInProgress)
            : reuseSuspenseHandlerOnStack(workInProgress);
          (current = nextHydratableInstance)
            ? ((renderLanes = canHydrateSuspenseInstance(
                current,
                rootOrSingletonContext
              )),
              null !== renderLanes &&
                ((JSCompiler_temp = {
                  dehydrated: renderLanes,
                  treeContext: getSuspendedTreeContext(),
                  retryLane: 536870912,
                  hydrationErrors: null
                }),
                (workInProgress.memoizedState = JSCompiler_temp),
                (JSCompiler_temp =
                  createFiberFromDehydratedFragment(renderLanes)),
                (JSCompiler_temp.return = workInProgress),
                (workInProgress.child = JSCompiler_temp),
                (hydrationParentFiber = workInProgress),
                (nextHydratableInstance = null)))
            : (renderLanes = null);
          if (null === renderLanes)
            throw (
              (warnNonHydratedInstance(workInProgress, current),
              throwOnHydrationMismatch(workInProgress))
            );
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
            (nextProps.memoizedState =
              mountSuspenseOffscreenState(renderLanes)),
            (nextProps.childLanes = getRemainingWorkInPrimaryTree(
              current,
              JSCompiler_temp,
              renderLanes
            )),
            (workInProgress.memoizedState = SUSPENDED_MARKER),
            enableTransitionTracing &&
              ((workInProgress = enableTransitionTracing
                ? transitionStack.current
                : null),
              null !== workInProgress &&
                ((current = enableTransitionTracing
                  ? markerInstanceStack.current
                  : null),
                (renderLanes = nextProps.updateQueue),
                null === renderLanes
                  ? (nextProps.updateQueue = {
                      transitions: workInProgress,
                      markerInstances: current,
                      retryQueue: null
                    })
                  : ((renderLanes.transitions = workInProgress),
                    (renderLanes.markerInstances = current)))),
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
            (nextProps.memoizedState =
              mountSuspenseOffscreenState(renderLanes)),
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
        return mountSuspensePrimaryChildren(
          workInProgress,
          nextPrimaryChildren
        );
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
          warnIfHydrating(),
          0 !== (renderLanes & 536870912) &&
            markRenderDerivedCause(workInProgress),
          isSuspenseInstanceFallback(nextPrimaryChildren))
        )
          (showFallback =
            getSuspenseInstanceFallbackErrorDetails(nextPrimaryChildren)),
            (JSCompiler_temp = showFallback.digest),
            (nextPrimaryChildren = showFallback.message),
            (nextProps = showFallback.stack),
            (showFallback = showFallback.componentStack),
            (nextPrimaryChildren = nextPrimaryChildren
              ? Error(nextPrimaryChildren)
              : Error(
                  "The server could not finish this Suspense boundary, likely due to an error during server rendering. Switched to client rendering."
                )),
            (nextPrimaryChildren.stack = nextProps || ""),
            (nextPrimaryChildren.digest = JSCompiler_temp),
            (JSCompiler_temp = void 0 === showFallback ? null : showFallback),
            (nextProps = {
              value: nextPrimaryChildren,
              source: null,
              stack: JSCompiler_temp
            }),
            "string" === typeof JSCompiler_temp &&
              CapturedStacks.set(nextPrimaryChildren, nextProps),
            queueHydrationError(nextProps),
            (workInProgress = retrySuspenseComponentWithoutHydrating(
              current,
              workInProgress,
              renderLanes
            ));
        else if (
          (didReceiveUpdate ||
            propagateParentContextChanges(
              current,
              workInProgress,
              renderLanes,
              !1
            ),
          (JSCompiler_temp = 0 !== (renderLanes & current.childLanes)),
          didReceiveUpdate || JSCompiler_temp)
        ) {
          JSCompiler_temp = workInProgressRoot;
          if (
            null !== JSCompiler_temp &&
            ((nextProps = getBumpedLaneForHydration(
              JSCompiler_temp,
              renderLanes
            )),
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
            : ((current = nextFallbackChildren.treeContext),
              supportsHydration &&
                ((nextHydratableInstance =
                  getFirstHydratableChildWithinSuspenseInstance(
                    nextPrimaryChildren
                  )),
                (hydrationParentFiber = workInProgress),
                (isHydrating = !0),
                (hydrationErrors = null),
                (didSuspendOrErrorDEV = !1),
                (hydrationDiffRootDEV = null),
                (rootOrSingletonContext = !1),
                null !== current &&
                  restoreSuspendedTreeContext(workInProgress, current)),
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
          (didSuspend = nextFallbackChildren.sibling),
          (nextProps = createWorkInProgress(nextFallbackChildren, {
            mode: "hidden",
            children: nextProps.children
          })),
          (nextProps.subtreeFlags =
            nextFallbackChildren.subtreeFlags & 65011712),
          null !== didSuspend
            ? (nextPrimaryChildren = createWorkInProgress(
                didSuspend,
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
                ? ((nextFallbackChildren = isPrimaryRenderer
                    ? CacheContext._currentValue
                    : CacheContext._currentValue2),
                  (showFallback =
                    showFallback.parent !== nextFallbackChildren
                      ? {
                          parent: nextFallbackChildren,
                          pool: nextFallbackChildren
                        }
                      : showFallback))
                : (showFallback = getSuspendedCache()),
              (nextPrimaryChildren = {
                baseLanes: nextPrimaryChildren.baseLanes | renderLanes,
                cachePool: showFallback
              })),
          (nextProps.memoizedState = nextPrimaryChildren),
          enableTransitionTracing &&
            ((nextPrimaryChildren = enableTransitionTracing
              ? transitionStack.current
              : null),
            null !== nextPrimaryChildren &&
              ((showFallback = enableTransitionTracing
                ? markerInstanceStack.current
                : null),
              (nextFallbackChildren = nextProps.updateQueue),
              (didSuspend = current.updateQueue),
              null === nextFallbackChildren
                ? (nextProps.updateQueue = {
                    transitions: nextPrimaryChildren,
                    markerInstances: showFallback,
                    retryQueue: null
                  })
                : nextFallbackChildren === didSuspend
                  ? (nextProps.updateQueue = {
                      transitions: nextPrimaryChildren,
                      markerInstances: showFallback,
                      retryQueue:
                        null !== didSuspend ? didSuspend.retryQueue : null
                    })
                  : ((nextFallbackChildren.transitions = nextPrimaryChildren),
                    (nextFallbackChildren.markerInstances = showFallback)))),
          (nextProps.childLanes = getRemainingWorkInPrimaryTree(
            current,
            JSCompiler_temp,
            renderLanes
          )),
          (workInProgress.memoizedState = SUSPENDED_MARKER),
          bailoutOffscreenComponent(current.child, nextProps)
        );
      null !== nextFallbackChildren &&
        (renderLanes & 62914560) === renderLanes &&
        0 !== (renderLanes & current.lanes) &&
        markRenderDerivedCause(workInProgress);
      pushPrimaryTreeSuspenseHandler(workInProgress);
      renderLanes = current.child;
      current = renderLanes.sibling;
      renderLanes = createWorkInProgress(renderLanes, {
        mode: "visible",
        children: nextProps.children
      });
      renderLanes.return = workInProgress;
      renderLanes.sibling = null;
      null !== current &&
        ((JSCompiler_temp = workInProgress.deletions),
        null === JSCompiler_temp
          ? ((workInProgress.deletions = [current]),
            (workInProgress.flags |= 16))
          : JSCompiler_temp.push(current));
      workInProgress.child = renderLanes;
      workInProgress.memoizedState = null;
      return renderLanes;
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
      var mode = workInProgress.mode;
      primaryChildren = mountWorkInProgressOffscreenFiber(
        { mode: "hidden", children: primaryChildren },
        mode
      );
      fallbackChildren = createFiberFromFragment(
        fallbackChildren,
        mode,
        renderLanes,
        null
      );
      primaryChildren.return = workInProgress;
      fallbackChildren.return = workInProgress;
      primaryChildren.sibling = fallbackChildren;
      workInProgress.child = primaryChildren;
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
      scheduleContextWorkOnParentPath(
        fiber.return,
        renderLanes,
        propagationRoot
      );
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
        tailMode = nextProps.tail,
        newChildren = nextProps.children,
        suspenseContext = suspenseStackCursor.current;
      (nextProps = 0 !== (suspenseContext & ForceSuspenseFallback))
        ? ((suspenseContext =
            (suspenseContext & SubtreeSuspenseContextMask) |
            ForceSuspenseFallback),
          (workInProgress.flags |= 128))
        : (suspenseContext &= SubtreeSuspenseContextMask);
      push(suspenseStackCursor, suspenseContext, workInProgress);
      suspenseContext = null == revealOrder ? "null" : revealOrder;
      if (
        "forwards" !== revealOrder &&
        "unstable_legacy-backwards" !== revealOrder &&
        "together" !== revealOrder &&
        "independent" !== revealOrder &&
        !didWarnAboutRevealOrder[suspenseContext]
      )
        if (
          ((didWarnAboutRevealOrder[suspenseContext] = !0), null == revealOrder)
        )
          console.error(
            'The default for the <SuspenseList revealOrder="..."> prop is changing. To be future compatible you must explictly specify either "independent" (the current default), "together", "forwards" or "legacy_unstable-backwards".'
          );
        else if ("backwards" === revealOrder)
          console.error(
            'The rendering order of <SuspenseList revealOrder="backwards"> is changing. To be future compatible you must specify revealOrder="legacy_unstable-backwards" instead.'
          );
        else if ("string" === typeof revealOrder)
          switch (revealOrder.toLowerCase()) {
            case "together":
            case "forwards":
            case "backwards":
            case "independent":
              console.error(
                '"%s" is not a valid value for revealOrder on <SuspenseList />. Use lowercase "%s" instead.',
                revealOrder,
                revealOrder.toLowerCase()
              );
              break;
            case "forward":
            case "backward":
              console.error(
                '"%s" is not a valid value for revealOrder on <SuspenseList />. React uses the -s suffix in the spelling. Use "%ss" instead.',
                revealOrder,
                revealOrder.toLowerCase()
              );
              break;
            default:
              console.error(
                '"%s" is not a supported revealOrder on <SuspenseList />. Did you mean "independent", "together", "forwards" or "backwards"?',
                revealOrder
              );
          }
        else
          console.error(
            '%s is not a supported value for revealOrder on <SuspenseList />. Did you mean "independent", "together", "forwards" or "backwards"?',
            revealOrder
          );
      suspenseContext = null == tailMode ? "null" : tailMode;
      if (!didWarnAboutTailOptions[suspenseContext])
        if (null == tailMode) {
          if (
            "forwards" === revealOrder ||
            "backwards" === revealOrder ||
            "unstable_legacy-backwards" === revealOrder
          )
            (didWarnAboutTailOptions[suspenseContext] = !0),
              console.error(
                'The default for the <SuspenseList tail="..."> prop is changing. To be future compatible you must explictly specify either "visible" (the current default), "collapsed" or "hidden".'
              );
        } else
          "visible" !== tailMode &&
          "collapsed" !== tailMode &&
          "hidden" !== tailMode
            ? ((didWarnAboutTailOptions[suspenseContext] = !0),
              console.error(
                '"%s" is not a supported value for tail on <SuspenseList />. Did you mean "visible", "collapsed" or "hidden"?',
                tailMode
              ))
            : "forwards" !== revealOrder &&
              "backwards" !== revealOrder &&
              "unstable_legacy-backwards" !== revealOrder &&
              ((didWarnAboutTailOptions[suspenseContext] = !0),
              console.error(
                '<SuspenseList tail="%s" /> is only valid if revealOrder is "forwards" or "backwards". Did you mean to specify revealOrder="forwards"?',
                tailMode
              ));
      a: if (
        ("forwards" === revealOrder ||
          "backwards" === revealOrder ||
          "unstable_legacy-backwards" === revealOrder) &&
        void 0 !== newChildren &&
        null !== newChildren &&
        !1 !== newChildren
      )
        if (isArrayImpl(newChildren))
          for (
            suspenseContext = 0;
            suspenseContext < newChildren.length;
            suspenseContext++
          ) {
            if (
              !validateSuspenseListNestedChild(
                newChildren[suspenseContext],
                suspenseContext
              )
            )
              break a;
          }
        else if (
          ((suspenseContext = getIteratorFn(newChildren)),
          "function" === typeof suspenseContext)
        ) {
          if ((suspenseContext = suspenseContext.call(newChildren)))
            for (
              var step = suspenseContext.next(), _i = 0;
              !step.done;
              step = suspenseContext.next()
            ) {
              if (!validateSuspenseListNestedChild(step.value, _i)) break a;
              _i++;
            }
        } else
          console.error(
            'A single row was passed to a <SuspenseList revealOrder="%s" />. This is not useful since it needs multiple rows. Did you mean to pass multiple children or an array?',
            revealOrder
          );
      reconcileChildren(current, workInProgress, newChildren, renderLanes);
      isHydrating
        ? (warnIfNotHydrating(), (newChildren = treeForkCount))
        : (newChildren = 0);
      if (!nextProps && null !== current && 0 !== (current.flags & 128))
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
            : ((revealOrder = renderLanes.sibling),
              (renderLanes.sibling = null));
          initSuspenseListRenderState(
            workInProgress,
            !1,
            revealOrder,
            renderLanes,
            tailMode,
            newChildren
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
            newChildren
          );
          break;
        case "together":
          initSuspenseListRenderState(
            workInProgress,
            !1,
            null,
            null,
            void 0,
            newChildren
          );
          break;
        default:
          workInProgress.memoizedState = null;
      }
      return workInProgress.child;
    }
    function bailoutOnAlreadyFinishedWork(
      current,
      workInProgress,
      renderLanes
    ) {
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
        throw Error("Resuming work not yet implemented.");
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
          pushHostContainer(
            workInProgress,
            workInProgress.stateNode.containerInfo
          );
          enableTransitionTracing &&
            push(transitionStack, workInProgressTransitions, workInProgress);
          enableTransitionTracing && pushRootMarkerInstance(workInProgress);
          pushProvider(
            workInProgress,
            CacheContext,
            current.memoizedState.cache
          );
          resetHydrationState();
          break;
        case 27:
        case 5:
          pushHostContext(workInProgress);
          break;
        case 4:
          pushHostContainer(
            workInProgress,
            workInProgress.stateNode.containerInfo
          );
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
              return updateSuspenseComponent(
                current,
                workInProgress,
                renderLanes
              );
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
          push(
            suspenseStackCursor,
            suspenseStackCursor.current,
            workInProgress
          );
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
          pushProvider(
            workInProgress,
            CacheContext,
            current.memoizedState.cache
          );
          break;
        case 25:
          if (enableTransitionTracing) {
            stateNode = workInProgress.stateNode;
            null !== stateNode && pushMarkerInstance(workInProgress, stateNode);
            break;
          }
        case 23:
          return (
            (workInProgress.lanes = 0),
            updateOffscreenComponent(
              current,
              workInProgress,
              renderLanes,
              workInProgress.pendingProps
            )
          );
      }
      return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
    }
    function beginWork(current, workInProgress, renderLanes) {
      if (workInProgress._debugNeedsRemount && null !== current) {
        renderLanes = createFiberFromTypeAndProps(
          workInProgress.type,
          workInProgress.key,
          workInProgress.pendingProps,
          workInProgress._debugOwner || null,
          workInProgress.mode,
          workInProgress.lanes
        );
        renderLanes._debugStack = workInProgress._debugStack;
        renderLanes._debugTask = workInProgress._debugTask;
        var returnFiber = workInProgress.return;
        if (null === returnFiber) throw Error("Cannot swap the root fiber.");
        current.alternate = null;
        workInProgress.alternate = null;
        renderLanes.index = workInProgress.index;
        renderLanes.sibling = workInProgress.sibling;
        renderLanes.return = workInProgress.return;
        renderLanes.ref = workInProgress.ref;
        renderLanes._debugInfo = workInProgress._debugInfo;
        if (workInProgress === returnFiber.child)
          returnFiber.child = renderLanes;
        else {
          var prevSibling = returnFiber.child;
          if (null === prevSibling)
            throw Error("Expected parent to have a child.");
          for (; prevSibling.sibling !== workInProgress; )
            if (((prevSibling = prevSibling.sibling), null === prevSibling))
              throw Error("Expected to find the previous sibling.");
          prevSibling.sibling = renderLanes;
        }
        workInProgress = returnFiber.deletions;
        null === workInProgress
          ? ((returnFiber.deletions = [current]), (returnFiber.flags |= 16))
          : workInProgress.push(current);
        renderLanes.flags |= 2;
        return renderLanes;
      }
      if (null !== current)
        if (
          current.memoizedProps !== workInProgress.pendingProps ||
          workInProgress.type !== current.type
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
      else {
        didReceiveUpdate = !1;
        if ((returnFiber = isHydrating))
          warnIfNotHydrating(),
            (returnFiber = 0 !== (workInProgress.flags & 1048576));
        returnFiber &&
          ((returnFiber = workInProgress.index),
          warnIfNotHydrating(),
          pushTreeId(workInProgress, treeForkCount, returnFiber));
      }
      workInProgress.lanes = 0;
      switch (workInProgress.tag) {
        case 16:
          a: if (
            ((returnFiber = workInProgress.pendingProps),
            (current = resolveLazy(workInProgress.elementType)),
            (workInProgress.type = current),
            "function" === typeof current)
          )
            shouldConstruct(current)
              ? ((returnFiber = resolveClassComponentProps(
                  current,
                  returnFiber
                )),
                (workInProgress.tag = 1),
                (workInProgress.type = current =
                  resolveFunctionForHotReloading(current)),
                (workInProgress = updateClassComponent(
                  null,
                  workInProgress,
                  current,
                  returnFiber,
                  renderLanes
                )))
              : ((workInProgress.tag = 0),
                validateFunctionComponentInDev(workInProgress, current),
                (workInProgress.type = current =
                  resolveFunctionForHotReloading(current)),
                (workInProgress = updateFunctionComponent(
                  null,
                  workInProgress,
                  current,
                  returnFiber,
                  renderLanes
                )));
          else {
            if (void 0 !== current && null !== current)
              if (
                ((prevSibling = current.$$typeof),
                prevSibling === REACT_FORWARD_REF_TYPE)
              ) {
                workInProgress.tag = 11;
                workInProgress.type = current =
                  resolveForwardRefForHotReloading(current);
                workInProgress = updateForwardRef(
                  null,
                  workInProgress,
                  current,
                  returnFiber,
                  renderLanes
                );
                break a;
              } else if (prevSibling === REACT_MEMO_TYPE) {
                workInProgress.tag = 14;
                workInProgress = updateMemoComponent(
                  null,
                  workInProgress,
                  current,
                  returnFiber,
                  renderLanes
                );
                break a;
              }
            workInProgress = "";
            null !== current &&
              "object" === typeof current &&
              current.$$typeof === REACT_LAZY_TYPE &&
              (workInProgress =
                " Did you wrap a component in React.lazy() more than once?");
            current = getComponentNameFromType(current) || current;
            throw Error(
              "Element type is invalid. Received a promise that resolves to: " +
                current +
                ". Lazy element type must resolve to a class or function." +
                workInProgress
            );
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
            (returnFiber = workInProgress.type),
            (prevSibling = resolveClassComponentProps(
              returnFiber,
              workInProgress.pendingProps
            )),
            updateClassComponent(
              current,
              workInProgress,
              returnFiber,
              prevSibling,
              renderLanes
            )
          );
        case 3:
          a: {
            pushHostContainer(
              workInProgress,
              workInProgress.stateNode.containerInfo
            );
            if (null === current)
              throw Error(
                "Should have a current fiber. This is a bug in React."
              );
            var nextProps = workInProgress.pendingProps;
            prevSibling = workInProgress.memoizedState;
            returnFiber = prevSibling.element;
            cloneUpdateQueue(current, workInProgress);
            processUpdateQueue(workInProgress, nextProps, null, renderLanes);
            var nextState = workInProgress.memoizedState;
            enableTransitionTracing &&
              push(transitionStack, workInProgressTransitions, workInProgress);
            enableTransitionTracing && pushRootMarkerInstance(workInProgress);
            nextProps = nextState.cache;
            pushProvider(workInProgress, CacheContext, nextProps);
            nextProps !== prevSibling.cache &&
              propagateContextChanges(
                workInProgress,
                [CacheContext],
                renderLanes,
                !0
              );
            suspendIfUpdateReadFromEntangledAsyncAction();
            nextProps = nextState.element;
            if (supportsHydration && prevSibling.isDehydrated)
              if (
                ((prevSibling = {
                  element: nextProps,
                  isDehydrated: !1,
                  cache: nextState.cache
                }),
                (workInProgress.updateQueue.baseState = prevSibling),
                (workInProgress.memoizedState = prevSibling),
                workInProgress.flags & 256)
              ) {
                workInProgress = mountHostRootWithoutHydrating(
                  current,
                  workInProgress,
                  nextProps,
                  renderLanes
                );
                break a;
              } else if (nextProps !== returnFiber) {
                returnFiber = createCapturedValueAtFiber(
                  Error(
                    "This root received an early update, before anything was able hydrate. Switched the entire root to client rendering."
                  ),
                  workInProgress
                );
                queueHydrationError(returnFiber);
                workInProgress = mountHostRootWithoutHydrating(
                  current,
                  workInProgress,
                  nextProps,
                  renderLanes
                );
                break a;
              } else
                for (
                  supportsHydration &&
                    ((nextHydratableInstance =
                      getFirstHydratableChildWithinContainer(
                        workInProgress.stateNode.containerInfo
                      )),
                    (hydrationParentFiber = workInProgress),
                    (isHydrating = !0),
                    (hydrationErrors = null),
                    (didSuspendOrErrorDEV = !1),
                    (hydrationDiffRootDEV = null),
                    (rootOrSingletonContext = !0)),
                    current = mountChildFibers(
                      workInProgress,
                      null,
                      nextProps,
                      renderLanes
                    ),
                    workInProgress.child = current;
                  current;

                )
                  (current.flags = (current.flags & -3) | 4096),
                    (current = current.sibling);
            else {
              resetHydrationState();
              if (nextProps === returnFiber) {
                workInProgress = bailoutOnAlreadyFinishedWork(
                  current,
                  workInProgress,
                  renderLanes
                );
                break a;
              }
              reconcileChildren(
                current,
                workInProgress,
                nextProps,
                renderLanes
              );
            }
            workInProgress = workInProgress.child;
          }
          return workInProgress;
        case 26:
          if (supportsResources)
            return (
              markRef(current, workInProgress),
              null === current
                ? (current = getResource(
                    workInProgress.type,
                    null,
                    workInProgress.pendingProps,
                    null
                  ))
                  ? (workInProgress.memoizedState = current)
                  : isHydrating ||
                    (workInProgress.stateNode = createHoistableInstance(
                      workInProgress.type,
                      workInProgress.pendingProps,
                      requiredContext(rootInstanceStackCursor.current),
                      workInProgress
                    ))
                : (workInProgress.memoizedState = getResource(
                    workInProgress.type,
                    current.memoizedProps,
                    workInProgress.pendingProps,
                    current.memoizedState
                  )),
              null
            );
        case 27:
          if (supportsSingletons)
            return (
              pushHostContext(workInProgress),
              null === current &&
                supportsSingletons &&
                isHydrating &&
                ((prevSibling = requiredContext(
                  rootInstanceStackCursor.current
                )),
                (returnFiber = getHostContext()),
                (prevSibling = workInProgress.stateNode =
                  resolveSingletonInstance(
                    workInProgress.type,
                    workInProgress.pendingProps,
                    prevSibling,
                    returnFiber,
                    !1
                  )),
                didSuspendOrErrorDEV ||
                  ((returnFiber = diffHydratedPropsForDevWarnings(
                    prevSibling,
                    workInProgress.type,
                    workInProgress.pendingProps,
                    returnFiber
                  )),
                  null !== returnFiber &&
                    (buildHydrationDiffNode(workInProgress, 0).serverProps =
                      returnFiber)),
                (hydrationParentFiber = workInProgress),
                (rootOrSingletonContext = !0),
                (nextHydratableInstance =
                  getFirstHydratableChildWithinSingleton(
                    workInProgress.type,
                    prevSibling,
                    nextHydratableInstance
                  ))),
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
          return (
            null === current &&
              isHydrating &&
              ((nextProps = getHostContext()),
              (returnFiber = validateHydratableInstance(
                workInProgress.type,
                workInProgress.pendingProps,
                nextProps
              )),
              (prevSibling = nextHydratableInstance),
              (nextState = !prevSibling) ||
                ((nextState = canHydrateInstance(
                  prevSibling,
                  workInProgress.type,
                  workInProgress.pendingProps,
                  rootOrSingletonContext
                )),
                null !== nextState
                  ? ((workInProgress.stateNode = nextState),
                    didSuspendOrErrorDEV ||
                      ((nextProps = diffHydratedPropsForDevWarnings(
                        nextState,
                        workInProgress.type,
                        workInProgress.pendingProps,
                        nextProps
                      )),
                      null !== nextProps &&
                        (buildHydrationDiffNode(workInProgress, 0).serverProps =
                          nextProps)),
                    (hydrationParentFiber = workInProgress),
                    (nextHydratableInstance =
                      getFirstHydratableChild(nextState)),
                    (rootOrSingletonContext = !1),
                    (nextProps = !0))
                  : (nextProps = !1),
                (nextState = !nextProps)),
              nextState &&
                (returnFiber &&
                  warnNonHydratedInstance(workInProgress, prevSibling),
                throwOnHydrationMismatch(workInProgress))),
            pushHostContext(workInProgress),
            (prevSibling = workInProgress.type),
            (nextProps = workInProgress.pendingProps),
            (nextState = null !== current ? current.memoizedProps : null),
            (returnFiber = nextProps.children),
            shouldSetTextContent(prevSibling, nextProps)
              ? (returnFiber = null)
              : null !== nextState &&
                shouldSetTextContent(prevSibling, nextState) &&
                (workInProgress.flags |= 32),
            null !== workInProgress.memoizedState &&
              ((prevSibling = renderWithHooks(
                current,
                workInProgress,
                TransitionAwareHostComponent,
                null,
                null,
                renderLanes
              )),
              isPrimaryRenderer
                ? (HostTransitionContext._currentValue = prevSibling)
                : (HostTransitionContext._currentValue2 = prevSibling)),
            markRef(current, workInProgress),
            reconcileChildren(
              current,
              workInProgress,
              returnFiber,
              renderLanes
            ),
            workInProgress.child
          );
        case 6:
          return (
            null === current &&
              isHydrating &&
              ((current = workInProgress.pendingProps),
              (renderLanes = getHostContext()),
              (current = validateHydratableTextInstance(current, renderLanes)),
              (renderLanes = nextHydratableInstance),
              (returnFiber = !renderLanes) ||
                ((returnFiber = canHydrateTextInstance(
                  renderLanes,
                  workInProgress.pendingProps,
                  rootOrSingletonContext
                )),
                null !== returnFiber
                  ? ((workInProgress.stateNode = returnFiber),
                    (hydrationParentFiber = workInProgress),
                    (nextHydratableInstance = null),
                    (returnFiber = !0))
                  : (returnFiber = !1),
                (returnFiber = !returnFiber)),
              returnFiber &&
                (current &&
                  warnNonHydratedInstance(workInProgress, renderLanes),
                throwOnHydrationMismatch(workInProgress))),
            null
          );
        case 13:
          return updateSuspenseComponent(current, workInProgress, renderLanes);
        case 4:
          return (
            pushHostContainer(
              workInProgress,
              workInProgress.stateNode.containerInfo
            ),
            (returnFiber = workInProgress.pendingProps),
            null === current
              ? (workInProgress.child = reconcileChildFibers(
                  workInProgress,
                  null,
                  returnFiber,
                  renderLanes
                ))
              : reconcileChildren(
                  current,
                  workInProgress,
                  returnFiber,
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
            (returnFiber = workInProgress.pendingProps),
            enableFragmentRefs && markRef(current, workInProgress),
            reconcileChildren(
              current,
              workInProgress,
              returnFiber,
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
            (workInProgress.flags |= 4),
            (workInProgress.flags |= 2048),
            (returnFiber = workInProgress.stateNode),
            (returnFiber.effectDuration = -0),
            (returnFiber.passiveEffectDuration = -0),
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
            (returnFiber = workInProgress.type),
            (prevSibling = workInProgress.pendingProps),
            (nextProps = prevSibling.value),
            "value" in prevSibling ||
              hasWarnedAboutUsingNoValuePropOnContextProvider ||
              ((hasWarnedAboutUsingNoValuePropOnContextProvider = !0),
              console.error(
                "The `value` prop is required for the `<Context.Provider>`. Did you misspell it or forget to pass it?"
              )),
            pushProvider(workInProgress, returnFiber, nextProps),
            reconcileChildren(
              current,
              workInProgress,
              prevSibling.children,
              renderLanes
            ),
            workInProgress.child
          );
        case 9:
          return (
            (prevSibling = workInProgress.type._context),
            (returnFiber = workInProgress.pendingProps.children),
            "function" !== typeof returnFiber &&
              console.error(
                "A context consumer was rendered with multiple children, or a child that isn't a function. A context consumer expects a single child that is a function. If you did pass a function, make sure there is no trailing or leading whitespace around it."
              ),
            prepareToReadContext(workInProgress),
            (prevSibling = readContext(prevSibling)),
            enableSchedulingProfiler &&
              markComponentRenderStarted(workInProgress),
            (returnFiber = callComponentInDEV(
              returnFiber,
              prevSibling,
              void 0
            )),
            enableSchedulingProfiler && markComponentRenderStopped(),
            (workInProgress.flags |= 1),
            reconcileChildren(
              current,
              workInProgress,
              returnFiber,
              renderLanes
            ),
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
        case 19:
          return updateSuspenseListComponent(
            current,
            workInProgress,
            renderLanes
          );
        case 21:
          return (
            (returnFiber = workInProgress.pendingProps.children),
            markRef(current, workInProgress),
            reconcileChildren(
              current,
              workInProgress,
              returnFiber,
              renderLanes
            ),
            workInProgress.child
          );
        case 31:
          return updateActivityComponent(current, workInProgress, renderLanes);
        case 22:
          return updateOffscreenComponent(
            current,
            workInProgress,
            renderLanes,
            workInProgress.pendingProps
          );
        case 23:
          return updateOffscreenComponent(
            current,
            workInProgress,
            renderLanes,
            workInProgress.pendingProps
          );
        case 24:
          return (
            prepareToReadContext(workInProgress),
            (returnFiber = readContext(CacheContext)),
            null === current
              ? ((prevSibling = peekCacheFromPool()),
                null === prevSibling &&
                  ((prevSibling = workInProgressRoot),
                  (nextProps = createCache()),
                  (prevSibling.pooledCache = nextProps),
                  retainCache(nextProps),
                  null !== nextProps &&
                    (prevSibling.pooledCacheLanes |= renderLanes),
                  (prevSibling = nextProps)),
                (workInProgress.memoizedState = {
                  parent: returnFiber,
                  cache: prevSibling
                }),
                initializeUpdateQueue(workInProgress),
                pushProvider(workInProgress, CacheContext, prevSibling))
              : (0 !== (current.lanes & renderLanes) &&
                  (cloneUpdateQueue(current, workInProgress),
                  processUpdateQueue(workInProgress, null, null, renderLanes),
                  suspendIfUpdateReadFromEntangledAsyncAction()),
                (prevSibling = current.memoizedState),
                (nextProps = workInProgress.memoizedState),
                prevSibling.parent !== returnFiber
                  ? ((prevSibling = {
                      parent: returnFiber,
                      cache: returnFiber
                    }),
                    (workInProgress.memoizedState = prevSibling),
                    0 === workInProgress.lanes &&
                      (workInProgress.memoizedState =
                        workInProgress.updateQueue.baseState =
                          prevSibling),
                    pushProvider(workInProgress, CacheContext, returnFiber))
                  : ((returnFiber = nextProps.cache),
                    pushProvider(workInProgress, CacheContext, returnFiber),
                    returnFiber !== prevSibling.cache &&
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
        case 25:
          if (enableTransitionTracing)
            return (
              enableTransitionTracing
                ? ((returnFiber = workInProgress.pendingProps),
                  null === current
                    ? ((prevSibling = enableTransitionTracing
                        ? transitionStack.current
                        : null),
                      null !== prevSibling &&
                        ((prevSibling = {
                          tag: TransitionTracingMarker,
                          transitions: new Set(prevSibling),
                          pendingBoundaries: null,
                          name: returnFiber.name,
                          aborts: null
                        }),
                        (workInProgress.stateNode = prevSibling),
                        (workInProgress.flags |= 2048)))
                    : current.memoizedProps.name !== returnFiber.name &&
                      console.error(
                        "Changing the name of a tracing marker after mount is not supported. To remount the tracing marker, pass it a new key."
                      ),
                  (prevSibling = workInProgress.stateNode),
                  null !== prevSibling &&
                    pushMarkerInstance(workInProgress, prevSibling),
                  reconcileChildren(
                    current,
                    workInProgress,
                    returnFiber.children,
                    renderLanes
                  ),
                  (workInProgress = workInProgress.child))
                : (workInProgress = null),
              workInProgress
            );
          break;
        case 30:
          if (enableViewTransition)
            return (
              (returnFiber = workInProgress.pendingProps),
              null != returnFiber.name && "auto" !== returnFiber.name
                ? (workInProgress.flags |=
                    null === current ? 18882560 : 18874368)
                : isHydrating && pushMaterializedTreeId(workInProgress),
              void 0 !== returnFiber.className &&
                ((prevSibling =
                  "string" === typeof returnFiber.className
                    ? JSON.stringify(returnFiber.className)
                    : "{...}"),
                didWarnAboutClassNameOnViewTransition[prevSibling] ||
                  ((didWarnAboutClassNameOnViewTransition[prevSibling] = !0),
                  console.error(
                    '<ViewTransition> doesn\'t accept a "className" prop. It has been renamed to "default".\n-   <ViewTransition className=%s>\n+   <ViewTransition default=%s>',
                    prevSibling,
                    prevSibling
                  ))),
              null !== current &&
              current.memoizedProps.name !== returnFiber.name
                ? (workInProgress.flags |= 4194816)
                : markRef(current, workInProgress),
              reconcileChildren(
                current,
                workInProgress,
                returnFiber.children,
                renderLanes
              ),
              workInProgress.child
            );
          break;
        case 29:
          throw workInProgress.pendingProps;
      }
      throw Error(
        "Unknown unit of work tag (" +
          workInProgress.tag +
          "). This error is likely caused by a bug in React. Please file an issue."
      );
    }
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
            instance = getPublicInstance(node.stateNode);
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
          var scopedNode = startingChild;
          var fn = fn$jscomp$0;
          if (5 === scopedNode.tag) {
            var type = scopedNode.type,
              memoizedProps = scopedNode.memoizedProps,
              instance = getPublicInstance(scopedNode.stateNode);
            if (null !== instance && !0 === fn(type, memoizedProps, instance)) {
              scopedNode = instance;
              break a;
            }
          }
          type = scopedNode.child;
          isFiberSuspenseAndTimedOut(scopedNode) &&
            (type = scopedNode.child.sibling.child);
          scopedNode =
            null !== type ? collectFirstScopedNodeFromChildren(type, fn) : null;
        }
        if (null !== scopedNode) return scopedNode;
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
        if (10 === node.tag && node.type === context)
          childContextValues.push(node.memoizedProps.value);
        else {
          var child = node.child;
          isFiberSuspenseAndTimedOut(node) &&
            (child = node.child.sibling.child);
          null !== child &&
            collectNearestChildContextValues(
              child,
              context,
              childContextValues
            );
        }
        startingChild = startingChild.sibling;
      }
    }
    function DO_NOT_USE_queryAllNodes(fn) {
      var currentFiber = getInstanceFromScope(this);
      if (null === currentFiber) return null;
      currentFiber = currentFiber.child;
      var scopedNodes = [];
      null !== currentFiber &&
        collectScopedNodesFromChildren(currentFiber, fn, scopedNodes);
      return 0 === scopedNodes.length ? null : scopedNodes;
    }
    function DO_NOT_USE_queryFirstNode(fn) {
      var currentFiber = getInstanceFromScope(this);
      if (null === currentFiber) return null;
      currentFiber = currentFiber.child;
      return null !== currentFiber
        ? collectFirstScopedNodeFromChildren(currentFiber, fn)
        : null;
    }
    function containsNode(node) {
      for (node = getInstanceFromNode(node); null !== node; ) {
        if (21 === node.tag && node.stateNode === this) return !0;
        node = node.return;
      }
      return !1;
    }
    function getChildContextValues(context) {
      var currentFiber = getInstanceFromScope(this);
      if (null === currentFiber) return [];
      currentFiber = currentFiber.child;
      var childContextValues = [];
      null !== currentFiber &&
        collectNearestChildContextValues(
          currentFiber,
          context,
          childContextValues
        );
      return childContextValues;
    }
    function markUpdate(workInProgress) {
      workInProgress.flags |= 4;
    }
    function markCloned(workInProgress) {
      supportsPersistence && (workInProgress.flags |= 8);
    }
    function doesRequireClone(current, completedWork) {
      if (null !== current && current.child === completedWork.child) return !1;
      if (0 !== (completedWork.flags & 16)) return !0;
      for (current = completedWork.child; null !== current; ) {
        if (0 !== (current.flags & 8218) || 0 !== (current.subtreeFlags & 8218))
          return !0;
        current = current.sibling;
      }
      return !1;
    }
    function appendAllChildren(
      parent,
      workInProgress,
      needsVisibilityToggle,
      isHidden
    ) {
      if (supportsMutation)
        for (
          needsVisibilityToggle = workInProgress.child;
          null !== needsVisibilityToggle;

        ) {
          if (
            5 === needsVisibilityToggle.tag ||
            6 === needsVisibilityToggle.tag
          )
            appendInitialChild(parent, needsVisibilityToggle.stateNode);
          else if (
            !(
              4 === needsVisibilityToggle.tag ||
              (supportsSingletons && 27 === needsVisibilityToggle.tag)
            ) &&
            null !== needsVisibilityToggle.child
          ) {
            needsVisibilityToggle.child.return = needsVisibilityToggle;
            needsVisibilityToggle = needsVisibilityToggle.child;
            continue;
          }
          if (needsVisibilityToggle === workInProgress) break;
          for (; null === needsVisibilityToggle.sibling; ) {
            if (
              null === needsVisibilityToggle.return ||
              needsVisibilityToggle.return === workInProgress
            )
              return;
            needsVisibilityToggle = needsVisibilityToggle.return;
          }
          needsVisibilityToggle.sibling.return = needsVisibilityToggle.return;
          needsVisibilityToggle = needsVisibilityToggle.sibling;
        }
      else if (supportsPersistence)
        for (var _node = workInProgress.child; null !== _node; ) {
          if (5 === _node.tag) {
            var instance = _node.stateNode;
            needsVisibilityToggle &&
              isHidden &&
              (instance = cloneHiddenInstance(
                instance,
                _node.type,
                _node.memoizedProps
              ));
            appendInitialChild(parent, instance);
          } else if (6 === _node.tag)
            (instance = _node.stateNode),
              needsVisibilityToggle &&
                isHidden &&
                (instance = cloneHiddenTextInstance(
                  instance,
                  _node.memoizedProps
                )),
              appendInitialChild(parent, instance);
          else if (4 !== _node.tag)
            if (22 === _node.tag && null !== _node.memoizedState)
              (instance = _node.child),
                null !== instance && (instance.return = _node),
                appendAllChildren(parent, _node, !0, !0);
            else if (null !== _node.child) {
              _node.child.return = _node;
              _node = _node.child;
              continue;
            }
          if (_node === workInProgress) break;
          for (; null === _node.sibling; ) {
            if (null === _node.return || _node.return === workInProgress)
              return;
            _node = _node.return;
          }
          _node.sibling.return = _node.return;
          _node = _node.sibling;
        }
    }
    function appendAllChildrenToContainer(
      containerChildSet,
      workInProgress,
      needsVisibilityToggle,
      isHidden
    ) {
      var hasOffscreenComponentChild = !1;
      if (supportsPersistence)
        for (var node = workInProgress.child; null !== node; ) {
          if (5 === node.tag) {
            var instance = node.stateNode;
            needsVisibilityToggle &&
              isHidden &&
              (instance = cloneHiddenInstance(
                instance,
                node.type,
                node.memoizedProps
              ));
            appendChildToContainerChildSet(containerChildSet, instance);
          } else if (6 === node.tag)
            (instance = node.stateNode),
              needsVisibilityToggle &&
                isHidden &&
                (instance = cloneHiddenTextInstance(
                  instance,
                  node.memoizedProps
                )),
              appendChildToContainerChildSet(containerChildSet, instance);
          else if (4 !== node.tag)
            if (22 === node.tag && null !== node.memoizedState)
              (hasOffscreenComponentChild = node.child),
                null !== hasOffscreenComponentChild &&
                  (hasOffscreenComponentChild.return = node),
                appendAllChildrenToContainer(containerChildSet, node, !0, !0),
                (hasOffscreenComponentChild = !0);
            else if (null !== node.child) {
              node.child.return = node;
              node = node.child;
              continue;
            }
          if (node === workInProgress) break;
          for (; null === node.sibling; ) {
            if (null === node.return || node.return === workInProgress)
              return hasOffscreenComponentChild;
            node = node.return;
          }
          node.sibling.return = node.return;
          node = node.sibling;
        }
      return hasOffscreenComponentChild;
    }
    function updateHostContainer(current, workInProgress) {
      if (supportsPersistence && doesRequireClone(current, workInProgress)) {
        current = workInProgress.stateNode;
        var container = current.containerInfo,
          newChildSet = createContainerChildSet();
        appendAllChildrenToContainer(newChildSet, workInProgress, !1, !1);
        current.pendingChildren = newChildSet;
        markUpdate(workInProgress);
        finalizeContainerChildren(container, newChildSet);
      }
    }
    function updateHostComponent(current, workInProgress, type, newProps) {
      if (supportsMutation)
        current.memoizedProps !== newProps && markUpdate(workInProgress);
      else if (supportsPersistence) {
        var currentInstance = current.stateNode,
          _oldProps = current.memoizedProps;
        if (
          (current = doesRequireClone(current, workInProgress)) ||
          _oldProps !== newProps
        ) {
          var currentHostContext = getHostContext();
          _oldProps = cloneInstance(
            currentInstance,
            type,
            _oldProps,
            newProps,
            !current,
            null
          );
          _oldProps === currentInstance
            ? (workInProgress.stateNode = currentInstance)
            : (markCloned(workInProgress),
              finalizeInitialChildren(
                _oldProps,
                type,
                newProps,
                currentHostContext
              ) && markUpdate(workInProgress),
              (workInProgress.stateNode = _oldProps),
              current && appendAllChildren(_oldProps, workInProgress, !1, !1));
        } else workInProgress.stateNode = currentInstance;
      }
    }
    function preloadInstanceAndSuspendIfNeeded(
      workInProgress,
      type,
      oldProps,
      newProps,
      renderLanes
    ) {
      if (
        (workInProgress.mode & 32) !== NoMode &&
        (null === oldProps
          ? maySuspendCommit(type, newProps)
          : maySuspendCommitOnUpdate(type, oldProps, newProps))
      ) {
        if (
          ((workInProgress.flags |= 16777216),
          (renderLanes & 335544128) === renderLanes ||
            maySuspendCommitInSyncRender(type, newProps))
        )
          if (preloadInstance(workInProgress.stateNode, type, newProps))
            workInProgress.flags |= 8192;
          else if (shouldRemainOnPreviousScreen()) workInProgress.flags |= 8192;
          else
            throw (
              ((suspendedThenable = noopSuspenseyCommitThenable),
              SuspenseyCommitException)
            );
      } else workInProgress.flags &= -16777217;
    }
    function preloadResourceAndSuspendIfNeeded(workInProgress, resource) {
      if (mayResourceSuspendCommit(resource)) {
        if (((workInProgress.flags |= 16777216), !preloadResource(resource)))
          if (shouldRemainOnPreviousScreen()) workInProgress.flags |= 8192;
          else
            throw (
              ((suspendedThenable = noopSuspenseyCommitThenable),
              SuspenseyCommitException)
            );
      } else workInProgress.flags &= -16777217;
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
            for (var _lastTailNode = null; null !== lastTailNode; )
              null !== lastTailNode.alternate && (_lastTailNode = lastTailNode),
                (lastTailNode = lastTailNode.sibling);
            null === _lastTailNode
              ? hasRenderedATailFallback || null === renderState.tail
                ? (renderState.tail = null)
                : (renderState.tail.sibling = null)
              : (_lastTailNode.sibling = null);
        }
    }
    function bubbleProperties(completedWork) {
      var didBailout =
          null !== completedWork.alternate &&
          completedWork.alternate.child === completedWork.child,
        newChildLanes = 0,
        subtreeFlags = 0;
      if (didBailout)
        if ((completedWork.mode & 2) !== NoMode) {
          for (
            var _treeBaseDuration = completedWork.selfBaseDuration,
              _child2 = completedWork.child;
            null !== _child2;

          )
            (newChildLanes |= _child2.lanes | _child2.childLanes),
              (subtreeFlags |= _child2.subtreeFlags & 65011712),
              (subtreeFlags |= _child2.flags & 65011712),
              (_treeBaseDuration += _child2.treeBaseDuration),
              (_child2 = _child2.sibling);
          completedWork.treeBaseDuration = _treeBaseDuration;
        } else
          for (
            _treeBaseDuration = completedWork.child;
            null !== _treeBaseDuration;

          )
            (newChildLanes |=
              _treeBaseDuration.lanes | _treeBaseDuration.childLanes),
              (subtreeFlags |= _treeBaseDuration.subtreeFlags & 65011712),
              (subtreeFlags |= _treeBaseDuration.flags & 65011712),
              (_treeBaseDuration.return = completedWork),
              (_treeBaseDuration = _treeBaseDuration.sibling);
      else if ((completedWork.mode & 2) !== NoMode) {
        _treeBaseDuration = completedWork.actualDuration;
        _child2 = completedWork.selfBaseDuration;
        for (var child = completedWork.child; null !== child; )
          (newChildLanes |= child.lanes | child.childLanes),
            (subtreeFlags |= child.subtreeFlags),
            (subtreeFlags |= child.flags),
            (_treeBaseDuration += child.actualDuration),
            (_child2 += child.treeBaseDuration),
            (child = child.sibling);
        completedWork.actualDuration = _treeBaseDuration;
        completedWork.treeBaseDuration = _child2;
      } else
        for (
          _treeBaseDuration = completedWork.child;
          null !== _treeBaseDuration;

        )
          (newChildLanes |=
            _treeBaseDuration.lanes | _treeBaseDuration.childLanes),
            (subtreeFlags |= _treeBaseDuration.subtreeFlags),
            (subtreeFlags |= _treeBaseDuration.flags),
            (_treeBaseDuration.return = completedWork),
            (_treeBaseDuration = _treeBaseDuration.sibling);
      completedWork.subtreeFlags |= subtreeFlags;
      completedWork.childLanes = newChildLanes;
      return didBailout;
    }
    function completeWork(current, workInProgress, renderLanes) {
      var newProps = workInProgress.pendingProps;
      popTreeContext(workInProgress);
      switch (workInProgress.tag) {
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
          renderLanes = workInProgress.stateNode;
          enableTransitionTracing &&
            null !== workInProgressTransitions &&
            (workInProgress.flags |= 2048);
          newProps = null;
          null !== current && (newProps = current.memoizedState.cache);
          workInProgress.memoizedState.cache !== newProps &&
            (workInProgress.flags |= 2048);
          popProvider(CacheContext, workInProgress);
          enableTransitionTracing &&
            enableTransitionTracing &&
            pop(markerInstanceStack, workInProgress);
          enableTransitionTracing && pop(transitionStack, workInProgress);
          popHostContainer(workInProgress);
          renderLanes.pendingContext &&
            ((renderLanes.context = renderLanes.pendingContext),
            (renderLanes.pendingContext = null));
          if (null === current || null === current.child)
            popHydrationState(workInProgress)
              ? (emitPendingHydrationWarnings(), markUpdate(workInProgress))
              : null === current ||
                (current.memoizedState.isDehydrated &&
                  0 === (workInProgress.flags & 256)) ||
                ((workInProgress.flags |= 1024),
                upgradeHydrationErrorsToRecoverable());
          updateHostContainer(current, workInProgress);
          bubbleProperties(workInProgress);
          enableTransitionTracing &&
            0 !== (workInProgress.subtreeFlags & 8192) &&
            (workInProgress.flags |= 2048);
          return null;
        case 26:
          if (supportsResources) {
            var type = workInProgress.type,
              nextResource = workInProgress.memoizedState;
            null === current
              ? (markUpdate(workInProgress),
                null !== nextResource
                  ? (bubbleProperties(workInProgress),
                    preloadResourceAndSuspendIfNeeded(
                      workInProgress,
                      nextResource
                    ))
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
                    preloadResourceAndSuspendIfNeeded(
                      workInProgress,
                      nextResource
                    ))
                  : (bubbleProperties(workInProgress),
                    (workInProgress.flags &= -16777217))
                : ((nextResource = current.memoizedProps),
                  supportsMutation
                    ? nextResource !== newProps && markUpdate(workInProgress)
                    : updateHostComponent(
                        current,
                        workInProgress,
                        type,
                        newProps
                      ),
                  bubbleProperties(workInProgress),
                  preloadInstanceAndSuspendIfNeeded(
                    workInProgress,
                    type,
                    nextResource,
                    newProps,
                    renderLanes
                  ));
            return null;
          }
        case 27:
          if (supportsSingletons) {
            popHostContext(workInProgress);
            renderLanes = requiredContext(rootInstanceStackCursor.current);
            type = workInProgress.type;
            if (null !== current && null != workInProgress.stateNode)
              supportsMutation
                ? current.memoizedProps !== newProps &&
                  markUpdate(workInProgress)
                : updateHostComponent(current, workInProgress, type, newProps);
            else {
              if (!newProps) {
                if (null === workInProgress.stateNode)
                  throw Error(
                    "We must have new props for new mounts. This error is likely caused by a bug in React. Please file an issue."
                  );
                bubbleProperties(workInProgress);
                enableViewTransition &&
                  (workInProgress.subtreeFlags &= -33554433);
                return null;
              }
              current = getHostContext();
              popHydrationState(workInProgress)
                ? prepareToHydrateHostInstance(workInProgress, current)
                : ((current = resolveSingletonInstance(
                    type,
                    newProps,
                    renderLanes,
                    current,
                    !0
                  )),
                  (workInProgress.stateNode = current),
                  markUpdate(workInProgress));
            }
            bubbleProperties(workInProgress);
            enableViewTransition && (workInProgress.subtreeFlags &= -33554433);
            return null;
          }
        case 5:
          popHostContext(workInProgress);
          type = workInProgress.type;
          if (null !== current && null != workInProgress.stateNode)
            updateHostComponent(current, workInProgress, type, newProps);
          else {
            if (!newProps) {
              if (null === workInProgress.stateNode)
                throw Error(
                  "We must have new props for new mounts. This error is likely caused by a bug in React. Please file an issue."
                );
              bubbleProperties(workInProgress);
              enableViewTransition &&
                (workInProgress.subtreeFlags &= -33554433);
              return null;
            }
            nextResource = getHostContext();
            if (popHydrationState(workInProgress))
              prepareToHydrateHostInstance(workInProgress, nextResource),
                finalizeHydratedChildren(
                  workInProgress.stateNode,
                  type,
                  newProps,
                  nextResource
                ) && (workInProgress.flags |= 64);
            else {
              var _rootContainerInstance = requiredContext(
                rootInstanceStackCursor.current
              );
              _rootContainerInstance = createInstance(
                type,
                newProps,
                _rootContainerInstance,
                nextResource,
                workInProgress
              );
              markCloned(workInProgress);
              appendAllChildren(_rootContainerInstance, workInProgress, !1, !1);
              workInProgress.stateNode = _rootContainerInstance;
              finalizeInitialChildren(
                _rootContainerInstance,
                type,
                newProps,
                nextResource
              ) && markUpdate(workInProgress);
            }
          }
          bubbleProperties(workInProgress);
          enableViewTransition && (workInProgress.subtreeFlags &= -33554433);
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
            (renderLanes = current.memoizedProps),
              supportsMutation
                ? renderLanes !== newProps && markUpdate(workInProgress)
                : supportsPersistence &&
                  (renderLanes !== newProps
                    ? ((current = requiredContext(
                        rootInstanceStackCursor.current
                      )),
                      (renderLanes = getHostContext()),
                      markCloned(workInProgress),
                      (workInProgress.stateNode = createTextInstance(
                        newProps,
                        current,
                        renderLanes,
                        workInProgress
                      )))
                    : (workInProgress.stateNode = current.stateNode));
          else {
            if (
              "string" !== typeof newProps &&
              null === workInProgress.stateNode
            )
              throw Error(
                "We must have new props for new mounts. This error is likely caused by a bug in React. Please file an issue."
              );
            current = requiredContext(rootInstanceStackCursor.current);
            renderLanes = getHostContext();
            if (popHydrationState(workInProgress)) {
              if (!supportsHydration)
                throw Error(
                  "Expected prepareToHydrateHostTextInstance() to never be called. This error is likely caused by a bug in React. Please file an issue."
                );
              current = workInProgress.stateNode;
              renderLanes = workInProgress.memoizedProps;
              type = !didSuspendOrErrorDEV;
              newProps = null;
              nextResource = hydrationParentFiber;
              if (null !== nextResource)
                switch (nextResource.tag) {
                  case 3:
                    type &&
                      ((type = diffHydratedTextForDevWarnings(
                        current,
                        renderLanes,
                        newProps
                      )),
                      null !== type &&
                        (buildHydrationDiffNode(workInProgress, 0).serverProps =
                          type));
                    break;
                  case 27:
                  case 5:
                    (newProps = nextResource.memoizedProps),
                      type &&
                        ((type = diffHydratedTextForDevWarnings(
                          current,
                          renderLanes,
                          newProps
                        )),
                        null !== type &&
                          (buildHydrationDiffNode(
                            workInProgress,
                            0
                          ).serverProps = type));
                }
              hydrateTextInstance(
                current,
                renderLanes,
                workInProgress,
                newProps
              ) || throwOnHydrationMismatch(workInProgress, !0);
            } else
              markCloned(workInProgress),
                (workInProgress.stateNode = createTextInstance(
                  newProps,
                  current,
                  renderLanes,
                  workInProgress
                ));
          }
          bubbleProperties(workInProgress);
          return null;
        case 31:
          renderLanes = workInProgress.memoizedState;
          if (null === current || null !== current.memoizedState) {
            newProps = popHydrationState(workInProgress);
            if (null !== renderLanes) {
              if (null === current) {
                if (!newProps)
                  throw Error(
                    "A dehydrated suspense component was completed without a hydrated node. This is probably a bug in React."
                  );
                if (!supportsHydration)
                  throw Error(
                    "Expected prepareToHydrateHostActivityInstance() to never be called. This error is likely caused by a bug in React. Please file an issue."
                  );
                current = workInProgress.memoizedState;
                current = null !== current ? current.dehydrated : null;
                if (!current)
                  throw Error(
                    "Expected to have a hydrated activity instance. This error is likely caused by a bug in React. Please file an issue."
                  );
                hydrateActivityInstance(current, workInProgress);
                bubbleProperties(workInProgress);
                (workInProgress.mode & 2) !== NoMode &&
                  null !== renderLanes &&
                  ((current = workInProgress.child),
                  null !== current &&
                    (workInProgress.treeBaseDuration -=
                      current.treeBaseDuration));
              } else
                emitPendingHydrationWarnings(),
                  resetHydrationState(),
                  0 === (workInProgress.flags & 128) &&
                    (renderLanes = workInProgress.memoizedState = null),
                  (workInProgress.flags |= 4),
                  bubbleProperties(workInProgress),
                  (workInProgress.mode & 2) !== NoMode &&
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
              throw Error(
                "Client rendering an Activity suspended it again. This is a bug in React."
              );
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
                if (!nextResource)
                  throw Error(
                    "A dehydrated suspense component was completed without a hydrated node. This is probably a bug in React."
                  );
                if (!supportsHydration)
                  throw Error(
                    "Expected prepareToHydrateHostSuspenseInstance() to never be called. This error is likely caused by a bug in React. Please file an issue."
                  );
                nextResource = workInProgress.memoizedState;
                nextResource =
                  null !== nextResource ? nextResource.dehydrated : null;
                if (!nextResource)
                  throw Error(
                    "Expected to have a hydrated suspense instance. This error is likely caused by a bug in React. Please file an issue."
                  );
                hydrateSuspenseInstance(nextResource, workInProgress);
                bubbleProperties(workInProgress);
                (workInProgress.mode & 2) !== NoMode &&
                  null !== type &&
                  ((type = workInProgress.child),
                  null !== type &&
                    (workInProgress.treeBaseDuration -= type.treeBaseDuration));
              } else
                emitPendingHydrationWarnings(),
                  resetHydrationState(),
                  0 === (workInProgress.flags & 128) &&
                    (type = workInProgress.memoizedState = null),
                  (workInProgress.flags |= 4),
                  bubbleProperties(workInProgress),
                  (workInProgress.mode & 2) !== NoMode &&
                    null !== type &&
                    ((type = workInProgress.child),
                    null !== type &&
                      (workInProgress.treeBaseDuration -=
                        type.treeBaseDuration));
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
              (workInProgress.mode & 2) !== NoMode &&
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
            (enableTransitionTracing && (workInProgress.child.flags |= 2048),
            renderLanes && (workInProgress.child.flags |= 8192));
          scheduleRetryEffect(workInProgress, workInProgress.updateQueue);
          null !== workInProgress.updateQueue &&
            null != workInProgress.memoizedProps.suspenseCallback &&
            (workInProgress.flags |= 4);
          bubbleProperties(workInProgress);
          (workInProgress.mode & 2) !== NoMode &&
            renderLanes &&
            ((current = workInProgress.child),
            null !== current &&
              (workInProgress.treeBaseDuration -= current.treeBaseDuration));
          return null;
        case 4:
          return (
            popHostContainer(workInProgress),
            updateHostContainer(current, workInProgress),
            null === current &&
              preparePortalMount(workInProgress.stateNode.containerInfo),
            bubbleProperties(workInProgress),
            null
          );
        case 10:
          return (
            popProvider(workInProgress.type, workInProgress),
            bubbleProperties(workInProgress),
            null
          );
        case 19:
          pop(suspenseStackCursor, workInProgress);
          newProps = workInProgress.memoizedState;
          if (null === newProps) return bubbleProperties(workInProgress), null;
          type = 0 !== (workInProgress.flags & 128);
          nextResource = newProps.rendering;
          if (null === nextResource)
            if (type) cutOffTailIfNeeded(newProps, !1);
            else {
              if (
                workInProgressRootExitStatus !== RootInProgress ||
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
                    for (
                      renderLanes = workInProgress.child;
                      null !== renderLanes;

                    )
                      resetWorkInProgress(renderLanes, current),
                        (renderLanes = renderLanes.sibling);
                    push(
                      suspenseStackCursor,
                      (suspenseStackCursor.current &
                        SubtreeSuspenseContextMask) |
                        ForceSuspenseFallback,
                      workInProgress
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
              (renderLanes = type
                ? (renderLanes & SubtreeSuspenseContextMask) |
                  ForceSuspenseFallback
                : renderLanes & SubtreeSuspenseContextMask),
              push(suspenseStackCursor, renderLanes, workInProgress),
              isHydrating &&
                pushTreeFork(workInProgress, newProps.treeForkCount),
              current
            );
          bubbleProperties(workInProgress);
          return null;
        case 21:
          return (
            null === current &&
              ((current = {
                DO_NOT_USE_queryAllNodes: DO_NOT_USE_queryAllNodes,
                DO_NOT_USE_queryFirstNode: DO_NOT_USE_queryFirstNode,
                containsNode: containsNode,
                getChildContextValues: getChildContextValues
              }),
              (workInProgress.stateNode = current),
              prepareScopeUpdate(current, workInProgress)),
            null !== workInProgress.ref && markUpdate(workInProgress),
            bubbleProperties(workInProgress),
            null
          );
        case 22:
        case 23:
          return (
            popSuspenseHandler(workInProgress),
            popHiddenContext(workInProgress),
            (newProps = null !== workInProgress.memoizedState),
            23 !== workInProgress.tag &&
              (null !== current
                ? (null !== current.memoizedState) !== newProps &&
                  (workInProgress.flags |= 8192)
                : newProps && (workInProgress.flags |= 8192)),
            newProps
              ? 0 !== (renderLanes & 536870912) &&
                0 === (workInProgress.flags & 128) &&
                (bubbleProperties(workInProgress),
                23 !== workInProgress.tag &&
                  workInProgress.subtreeFlags & 6 &&
                  (workInProgress.flags |= 8192))
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
            popTransition(workInProgress, current),
            null
          );
        case 24:
          return (
            (renderLanes = null),
            null !== current && (renderLanes = current.memoizedState.cache),
            workInProgress.memoizedState.cache !== renderLanes &&
              (workInProgress.flags |= 2048),
            popProvider(CacheContext, workInProgress),
            bubbleProperties(workInProgress),
            null
          );
        case 25:
          return (
            enableTransitionTracing &&
              (null !== workInProgress.stateNode &&
                enableTransitionTracing &&
                pop(markerInstanceStack, workInProgress),
              bubbleProperties(workInProgress)),
            null
          );
        case 30:
          return (
            enableViewTransition &&
              ((workInProgress.flags |= 33554432),
              bubbleProperties(workInProgress)),
            null
          );
      }
      throw Error(
        "Unknown unit of work tag (" +
          workInProgress.tag +
          "). This error is likely caused by a bug in React. Please file an issue."
      );
    }
    function unwindWork(current, workInProgress) {
      popTreeContext(workInProgress);
      switch (workInProgress.tag) {
        case 1:
          return (
            (current = workInProgress.flags),
            current & 65536
              ? ((workInProgress.flags = (current & -65537) | 128),
                (workInProgress.mode & 2) !== NoMode &&
                  transferActualDuration(workInProgress),
                workInProgress)
              : null
          );
        case 3:
          return (
            popProvider(CacheContext, workInProgress),
            enableTransitionTracing &&
              enableTransitionTracing &&
              pop(markerInstanceStack, workInProgress),
            enableTransitionTracing && pop(transitionStack, workInProgress),
            popHostContainer(workInProgress),
            (current = workInProgress.flags),
            0 !== (current & 65536) && 0 === (current & 128)
              ? ((workInProgress.flags = (current & -65537) | 128),
                workInProgress)
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
              throw Error(
                "Threw in newly mounted dehydrated component. This is likely a bug in React. Please file an issue."
              );
            resetHydrationState();
          }
          current = workInProgress.flags;
          return current & 65536
            ? ((workInProgress.flags = (current & -65537) | 128),
              (workInProgress.mode & 2) !== NoMode &&
                transferActualDuration(workInProgress),
              workInProgress)
            : null;
        case 13:
          popSuspenseHandler(workInProgress);
          current = workInProgress.memoizedState;
          if (null !== current && null !== current.dehydrated) {
            if (null === workInProgress.alternate)
              throw Error(
                "Threw in newly mounted dehydrated component. This is likely a bug in React. Please file an issue."
              );
            resetHydrationState();
          }
          current = workInProgress.flags;
          return current & 65536
            ? ((workInProgress.flags = (current & -65537) | 128),
              (workInProgress.mode & 2) !== NoMode &&
                transferActualDuration(workInProgress),
              workInProgress)
            : null;
        case 19:
          return pop(suspenseStackCursor, workInProgress), null;
        case 4:
          return popHostContainer(workInProgress), null;
        case 10:
          return popProvider(workInProgress.type, workInProgress), null;
        case 22:
        case 23:
          return (
            popSuspenseHandler(workInProgress),
            popHiddenContext(workInProgress),
            popTransition(workInProgress, current),
            (current = workInProgress.flags),
            current & 65536
              ? ((workInProgress.flags = (current & -65537) | 128),
                (workInProgress.mode & 2) !== NoMode &&
                  transferActualDuration(workInProgress),
                workInProgress)
              : null
          );
        case 24:
          return popProvider(CacheContext, workInProgress), null;
        case 25:
          return (
            enableTransitionTracing &&
              null !== workInProgress.stateNode &&
              enableTransitionTracing &&
              pop(markerInstanceStack, workInProgress),
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
          popProvider(CacheContext, interruptedWork);
          enableTransitionTracing &&
            enableTransitionTracing &&
            pop(markerInstanceStack, interruptedWork);
          enableTransitionTracing && pop(transitionStack, interruptedWork);
          popHostContainer(interruptedWork);
          break;
        case 26:
        case 27:
        case 5:
          popHostContext(interruptedWork);
          break;
        case 4:
          popHostContainer(interruptedWork);
          break;
        case 31:
          null !== interruptedWork.memoizedState &&
            popSuspenseHandler(interruptedWork);
          break;
        case 13:
          popSuspenseHandler(interruptedWork);
          break;
        case 19:
          pop(suspenseStackCursor, interruptedWork);
          break;
        case 10:
          popProvider(interruptedWork.type, interruptedWork);
          break;
        case 22:
        case 23:
          popSuspenseHandler(interruptedWork);
          popHiddenContext(interruptedWork);
          popTransition(interruptedWork, current);
          break;
        case 24:
          popProvider(CacheContext, interruptedWork);
          break;
        case 25:
          enableTransitionTracing &&
            null !== interruptedWork.stateNode &&
            enableTransitionTracing &&
            pop(markerInstanceStack, interruptedWork);
      }
    }
    function shouldProfile(current) {
      return (current.mode & 2) !== NoMode;
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
            if (
              (updateQueue.tag & flags) === flags &&
              (enableSchedulingProfiler &&
                ((flags & Passive) !== NoFlags
                  ? enableSchedulingProfiler &&
                    null !== injectedProfilingHooks &&
                    "function" ===
                      typeof injectedProfilingHooks.markComponentPassiveEffectMountStarted &&
                    injectedProfilingHooks.markComponentPassiveEffectMountStarted(
                      finishedWork
                    )
                  : (flags & Layout) !== NoFlags &&
                    enableSchedulingProfiler &&
                    null !== injectedProfilingHooks &&
                    "function" ===
                      typeof injectedProfilingHooks.markComponentLayoutEffectMountStarted &&
                    injectedProfilingHooks.markComponentLayoutEffectMountStarted(
                      finishedWork
                    )),
              (lastEffect = void 0),
              (flags & Insertion) !== NoFlags &&
                (isRunningInsertionEffect = !0),
              (lastEffect = runWithFiberInDEV(
                finishedWork,
                callCreateInDEV,
                updateQueue
              )),
              (flags & Insertion) !== NoFlags &&
                (isRunningInsertionEffect = !1),
              enableSchedulingProfiler &&
                ((flags & Passive) !== NoFlags
                  ? enableSchedulingProfiler &&
                    null !== injectedProfilingHooks &&
                    "function" ===
                      typeof injectedProfilingHooks.markComponentPassiveEffectMountStopped &&
                    injectedProfilingHooks.markComponentPassiveEffectMountStopped()
                  : (flags & Layout) !== NoFlags &&
                    enableSchedulingProfiler &&
                    null !== injectedProfilingHooks &&
                    "function" ===
                      typeof injectedProfilingHooks.markComponentLayoutEffectMountStopped &&
                    injectedProfilingHooks.markComponentLayoutEffectMountStopped()),
              void 0 !== lastEffect && "function" !== typeof lastEffect)
            ) {
              var hookName = void 0;
              hookName =
                0 !== (updateQueue.tag & Layout)
                  ? "useLayoutEffect"
                  : 0 !== (updateQueue.tag & Insertion)
                    ? "useInsertionEffect"
                    : "useEffect";
              var addendum = void 0;
              addendum =
                null === lastEffect
                  ? " You returned null. If your effect does not require clean up, return undefined (or nothing)."
                  : "function" === typeof lastEffect.then
                    ? "\n\nIt looks like you wrote " +
                      hookName +
                      "(async () => ...) or returned a Promise. Instead, write the async function inside your effect and call it immediately:\n\n" +
                      hookName +
                      "(() => {\n  async function fetchData() {\n    // You can await here\n    const response = await MyAPI.getData(someId);\n    // ...\n  }\n  fetchData();\n}, [someId]); // Or [] if effect doesn't need props or state\n\nLearn more about data fetching with Hooks: https://react.dev/link/hooks-data-fetching"
                    : " You returned: " + lastEffect;
              runWithFiberInDEV(
                finishedWork,
                function (n, a) {
                  console.error(
                    "%s must not return anything besides a function, which is used for clean-up.%s",
                    n,
                    a
                  );
                },
                hookName,
                addendum
              );
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
      nearestMountedAncestor
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
              void 0 !== destroy &&
                ((inst.destroy = void 0),
                enableSchedulingProfiler &&
                  ((flags & Passive) !== NoFlags
                    ? enableSchedulingProfiler &&
                      null !== injectedProfilingHooks &&
                      "function" ===
                        typeof injectedProfilingHooks.markComponentPassiveEffectUnmountStarted &&
                      injectedProfilingHooks.markComponentPassiveEffectUnmountStarted(
                        finishedWork
                      )
                    : (flags & Layout) !== NoFlags &&
                      enableSchedulingProfiler &&
                      null !== injectedProfilingHooks &&
                      "function" ===
                        typeof injectedProfilingHooks.markComponentLayoutEffectUnmountStarted &&
                      injectedProfilingHooks.markComponentLayoutEffectUnmountStarted(
                        finishedWork
                      )),
                (flags & Insertion) !== NoFlags &&
                  (isRunningInsertionEffect = !0),
                (lastEffect = finishedWork),
                runWithFiberInDEV(
                  lastEffect,
                  callDestroyInDEV,
                  lastEffect,
                  nearestMountedAncestor,
                  destroy
                ),
                (flags & Insertion) !== NoFlags &&
                  (isRunningInsertionEffect = !1),
                enableSchedulingProfiler &&
                  ((flags & Passive) !== NoFlags
                    ? enableSchedulingProfiler &&
                      null !== injectedProfilingHooks &&
                      "function" ===
                        typeof injectedProfilingHooks.markComponentPassiveEffectUnmountStopped &&
                      injectedProfilingHooks.markComponentPassiveEffectUnmountStopped()
                    : (flags & Layout) !== NoFlags &&
                      enableSchedulingProfiler &&
                      null !== injectedProfilingHooks &&
                      "function" ===
                        typeof injectedProfilingHooks.markComponentLayoutEffectUnmountStopped &&
                      injectedProfilingHooks.markComponentLayoutEffectUnmountStopped()));
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
        finishedWork.type.defaultProps ||
          "ref" in finishedWork.memoizedProps ||
          didWarnAboutReassigningProps ||
          (instance.props !== finishedWork.memoizedProps &&
            console.error(
              "Expected %s props to match memoized props before processing the update queue. This might either be because of a bug in React, or because a component reassigns its own `this.props`. Please file an issue.",
              getComponentNameFromFiber(finishedWork) || "instance"
            ),
          instance.state !== finishedWork.memoizedState &&
            console.error(
              "Expected %s state to match memoized state before processing the update queue. This might either be because of a bug in React, or because a component reassigns its own `this.state`. Please file an issue.",
              getComponentNameFromFiber(finishedWork) || "instance"
            ));
        try {
          runWithFiberInDEV(
            finishedWork,
            commitCallbacks,
            updateQueue,
            instance
          );
        } catch (error) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error);
        }
      }
    }
    function callGetSnapshotBeforeUpdates(instance, prevProps, prevState) {
      return instance.getSnapshotBeforeUpdate(prevProps, prevState);
    }
    function commitClassSnapshot(finishedWork, current) {
      var prevProps = current.memoizedProps,
        prevState = current.memoizedState;
      current = finishedWork.stateNode;
      finishedWork.type.defaultProps ||
        "ref" in finishedWork.memoizedProps ||
        didWarnAboutReassigningProps ||
        (current.props !== finishedWork.memoizedProps &&
          console.error(
            "Expected %s props to match memoized props before getSnapshotBeforeUpdate. This might either be because of a bug in React, or because a component reassigns its own `this.props`. Please file an issue.",
            getComponentNameFromFiber(finishedWork) || "instance"
          ),
        current.state !== finishedWork.memoizedState &&
          console.error(
            "Expected %s state to match memoized state before getSnapshotBeforeUpdate. This might either be because of a bug in React, or because a component reassigns its own `this.state`. Please file an issue.",
            getComponentNameFromFiber(finishedWork) || "instance"
          ));
      try {
        var resolvedPrevProps = resolveClassComponentProps(
          finishedWork.type,
          prevProps
        );
        var snapshot = runWithFiberInDEV(
          finishedWork,
          callGetSnapshotBeforeUpdates,
          current,
          resolvedPrevProps,
          prevState
        );
        prevProps = didWarnAboutUndefinedSnapshotBeforeUpdate;
        void 0 !== snapshot ||
          prevProps.has(finishedWork.type) ||
          (prevProps.add(finishedWork.type),
          runWithFiberInDEV(finishedWork, function () {
            console.error(
              "%s.getSnapshotBeforeUpdate(): A snapshot value (or null) must be returned. You have returned undefined.",
              getComponentNameFromFiber(finishedWork)
            );
          }));
        current.__reactInternalSnapshotBeforeUpdate = snapshot;
      } catch (error) {
        captureCommitPhaseError(finishedWork, finishedWork.return, error);
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
      shouldProfile(current)
        ? (startEffectTimer(),
          runWithFiberInDEV(
            current,
            callComponentWillUnmountInDEV,
            current,
            nearestMountedAncestor,
            instance
          ),
          recordEffectDuration())
        : runWithFiberInDEV(
            current,
            callComponentWillUnmountInDEV,
            current,
            nearestMountedAncestor,
            instance
          );
    }
    function commitAttachRef(finishedWork) {
      var ref = finishedWork.ref;
      if (null !== ref) {
        switch (finishedWork.tag) {
          case 26:
          case 27:
          case 5:
            var instanceToUse = getPublicInstance(finishedWork.stateNode);
            break;
          case 30:
            if (enableViewTransition) {
              instanceToUse = finishedWork.stateNode;
              var name = getViewTransitionName(
                finishedWork.memoizedProps,
                instanceToUse
              );
              if (null === instanceToUse.ref || instanceToUse.ref.name !== name)
                instanceToUse.ref = createViewTransitionInstance(name);
              instanceToUse = instanceToUse.ref;
              break;
            }
            instanceToUse = finishedWork.stateNode;
            break;
          case 7:
            if (enableFragmentRefs) {
              null === finishedWork.stateNode &&
                (finishedWork.stateNode = createFragmentInstance(finishedWork));
              instanceToUse = finishedWork.stateNode;
              break;
            }
          default:
            instanceToUse = finishedWork.stateNode;
        }
        if ("function" === typeof ref)
          if (shouldProfile(finishedWork))
            try {
              startEffectTimer(),
                (finishedWork.refCleanup = ref(instanceToUse));
            } finally {
              recordEffectDuration();
            }
          else finishedWork.refCleanup = ref(instanceToUse);
        else
          "string" === typeof ref
            ? console.error("String refs are no longer supported.")
            : ref.hasOwnProperty("current") ||
              console.error(
                "Unexpected ref object provided for %s. Use either a ref-setter function or React.createRef().",
                getComponentNameFromFiber(finishedWork)
              ),
            (ref.current = instanceToUse);
      }
    }
    function safelyAttachRef(current, nearestMountedAncestor) {
      try {
        runWithFiberInDEV(current, commitAttachRef, current);
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
                startEffectTimer(), runWithFiberInDEV(current, refCleanup);
              } finally {
                recordEffectDuration(current);
              }
            else runWithFiberInDEV(current, refCleanup);
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
                startEffectTimer(), runWithFiberInDEV(current, ref, null);
              } finally {
                recordEffectDuration(current);
              }
            else runWithFiberInDEV(current, ref, null);
          } catch (error$3) {
            captureCommitPhaseError(current, nearestMountedAncestor, error$3);
          }
        else ref.current = null;
    }
    function commitProfiler(
      finishedWork,
      current,
      commitStartTime,
      effectDuration
    ) {
      var _finishedWork$memoize = finishedWork.memoizedProps,
        id = _finishedWork$memoize.id,
        onCommit = _finishedWork$memoize.onCommit;
      _finishedWork$memoize = _finishedWork$memoize.onRender;
      current = null === current ? "mount" : "update";
      currentUpdateIsNested && (current = "nested-update");
      "function" === typeof _finishedWork$memoize &&
        _finishedWork$memoize(
          id,
          current,
          finishedWork.actualDuration,
          finishedWork.treeBaseDuration,
          finishedWork.actualStartTime,
          commitStartTime
        );
      "function" === typeof onCommit &&
        onCommit(id, current, effectDuration, commitStartTime);
    }
    function commitProfilerPostCommitImpl(
      finishedWork,
      current,
      commitStartTime,
      passiveEffectDuration
    ) {
      var _finishedWork$memoize2 = finishedWork.memoizedProps;
      finishedWork = _finishedWork$memoize2.id;
      _finishedWork$memoize2 = _finishedWork$memoize2.onPostCommit;
      current = null === current ? "mount" : "update";
      currentUpdateIsNested && (current = "nested-update");
      "function" === typeof _finishedWork$memoize2 &&
        _finishedWork$memoize2(
          finishedWork,
          current,
          passiveEffectDuration,
          commitStartTime
        );
    }
    function commitProfilerPostCommit(
      finishedWork,
      current,
      commitStartTime,
      passiveEffectDuration
    ) {
      try {
        runWithFiberInDEV(
          finishedWork,
          commitProfilerPostCommitImpl,
          finishedWork,
          current,
          commitStartTime,
          passiveEffectDuration
        );
      } catch (error) {
        captureCommitPhaseError(finishedWork, finishedWork.return, error);
      }
    }
    function pushMutationContext() {
      if (!enableViewTransition) return !1;
      var prev = viewTransitionMutationContext;
      viewTransitionMutationContext = !1;
      return prev;
    }
    function popMutationContext(prev) {
      enableViewTransition &&
        (viewTransitionMutationContext && (rootMutationContext = !0),
        (viewTransitionMutationContext = prev));
    }
    function trackHostMutation() {
      enableViewTransition
        ? (viewTransitionMutationContext = !0)
        : (rootMutationContext = !0);
    }
    function commitHostMount(finishedWork) {
      var type = finishedWork.type,
        props = finishedWork.memoizedProps,
        instance = finishedWork.stateNode;
      try {
        runWithFiberInDEV(
          finishedWork,
          commitMount,
          instance,
          type,
          props,
          finishedWork
        );
      } catch (error) {
        captureCommitPhaseError(finishedWork, finishedWork.return, error);
      }
    }
    function commitHostUpdate(finishedWork, newProps, oldProps) {
      try {
        runWithFiberInDEV(
          finishedWork,
          commitUpdate,
          finishedWork.stateNode,
          finishedWork.type,
          oldProps,
          newProps,
          finishedWork
        );
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
        isFragmentInstanceParent(parent) &&
          deleteChildFromFragmentInstance(fiber.stateNode, parent.stateNode);
        if (isHostParent(parent)) break;
        parent = parent.return;
      }
    }
    function isHostParent(fiber) {
      return (
        5 === fiber.tag ||
        3 === fiber.tag ||
        (supportsResources ? 26 === fiber.tag : !1) ||
        (supportsSingletons
          ? 27 === fiber.tag && isSingletonScope(fiber.type)
          : !1) ||
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
          if (
            supportsSingletons &&
            27 === fiber.tag &&
            isSingletonScope(fiber.type)
          )
            continue a;
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
            ? insertInContainerBefore(parent, tag, before)
            : appendChildToContainer(parent, tag),
          enableFragmentRefs &&
            commitNewChildToFragmentInstances(node, parentFragmentInstances),
          trackHostMutation();
      else if (
        4 !== tag &&
        (supportsSingletons &&
          27 === tag &&
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
          before ? insertBefore(parent, tag, before) : appendChild(parent, tag),
          enableFragmentRefs &&
            commitNewChildToFragmentInstances(node, parentFragmentInstances),
          trackHostMutation();
      else if (
        4 !== tag &&
        (supportsSingletons &&
          27 === tag &&
          isSingletonScope(node.type) &&
          (parent = node.stateNode),
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
    function commitPlacement(finishedWork) {
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
      if (supportsMutation) {
        if (null == hostParentFiber)
          throw Error(
            "Expected to find a host parent. This error is likely caused by a bug in React. Please file an issue."
          );
        switch (hostParentFiber.tag) {
          case 27:
            if (supportsSingletons) {
              hostParentFiber = hostParentFiber.stateNode;
              parentFiber = getHostSibling(finishedWork);
              insertOrAppendPlacementNode(
                finishedWork,
                parentFiber,
                hostParentFiber,
                parentFragmentInstances
              );
              break;
            }
          case 5:
            parentFiber = hostParentFiber.stateNode;
            hostParentFiber.flags & 32 &&
              (resetTextContent(parentFiber), (hostParentFiber.flags &= -33));
            hostParentFiber = getHostSibling(finishedWork);
            insertOrAppendPlacementNode(
              finishedWork,
              hostParentFiber,
              parentFiber,
              parentFragmentInstances
            );
            break;
          case 3:
          case 4:
            hostParentFiber = hostParentFiber.stateNode.containerInfo;
            parentFiber = getHostSibling(finishedWork);
            insertOrAppendPlacementNodeIntoContainer(
              finishedWork,
              parentFiber,
              hostParentFiber,
              parentFragmentInstances
            );
            break;
          default:
            throw Error(
              "Invalid host parent fiber. This error is likely caused by a bug in React. Please file an issue."
            );
        }
      } else
        enableFragmentRefs &&
          commitImmutablePlacementNodeToFragmentInstances(
            finishedWork,
            parentFragmentInstances
          );
    }
    function commitImmutablePlacementNodeToFragmentInstances(
      finishedWork,
      parentFragmentInstances
    ) {
      if (enableFragmentRefs)
        if (5 === finishedWork.tag)
          commitNewChildToFragmentInstances(
            finishedWork,
            parentFragmentInstances
          );
        else if (
          4 !== finishedWork.tag &&
          ((finishedWork = finishedWork.child), null !== finishedWork)
        )
          for (
            commitImmutablePlacementNodeToFragmentInstances(
              finishedWork,
              parentFragmentInstances
            ),
              finishedWork = finishedWork.sibling;
            null !== finishedWork;

          )
            commitImmutablePlacementNodeToFragmentInstances(
              finishedWork,
              parentFragmentInstances
            ),
              (finishedWork = finishedWork.sibling);
    }
    function commitHostPortalContainerChildren(
      portal,
      finishedWork,
      pendingChildren
    ) {
      portal = portal.containerInfo;
      try {
        runWithFiberInDEV(
          finishedWork,
          replaceContainerChildren,
          portal,
          pendingChildren
        );
      } catch (error) {
        captureCommitPhaseError(finishedWork, finishedWork.return, error);
      }
    }
    function commitHostSingletonAcquisition(finishedWork) {
      var singleton = finishedWork.stateNode,
        props = finishedWork.memoizedProps;
      try {
        runWithFiberInDEV(
          finishedWork,
          acquireSingletonInstance,
          finishedWork.type,
          props,
          singleton,
          finishedWork
        );
      } catch (error) {
        captureCommitPhaseError(finishedWork, finishedWork.return, error);
      }
    }
    function trackEnterViewTransitions(placement) {
      if (30 === placement.tag || 0 !== (placement.subtreeFlags & 33554432))
        shouldStartViewTransition = !0;
    }
    function pushViewTransitionCancelableScope() {
      var prevChildren = viewTransitionCancelableChildren;
      viewTransitionCancelableChildren = null;
      return prevChildren;
    }
    function applyViewTransitionToHostInstances(
      fiber,
      name,
      className,
      collectMeasurements,
      stopAtNestedViewTransitions
    ) {
      viewTransitionHostInstanceIdx = 0;
      name = applyViewTransitionToHostInstancesRecursive(
        fiber.child,
        name,
        className,
        collectMeasurements,
        stopAtNestedViewTransitions
      );
      enableComponentPerformanceTrack &&
        name &&
        null != fiber._debugTask &&
        null === animatingTask &&
        (animatingTask = fiber._debugTask);
      return name;
    }
    function applyViewTransitionToHostInstancesRecursive(
      child,
      name,
      className,
      collectMeasurements,
      stopAtNestedViewTransitions
    ) {
      if (!supportsMutation) return !1;
      for (var inViewport = !1; null !== child; ) {
        if (5 === child.tag) {
          var instance = child.stateNode;
          if (null !== collectMeasurements) {
            var measurement = measureInstance(instance);
            collectMeasurements.push(measurement);
            wasInstanceInViewport(measurement) && (inViewport = !0);
          } else
            inViewport ||
              (wasInstanceInViewport(measureInstance(instance)) &&
                (inViewport = !0));
          shouldStartViewTransition = !0;
          applyViewTransitionName(
            instance,
            0 === viewTransitionHostInstanceIdx
              ? name
              : name + "_" + viewTransitionHostInstanceIdx,
            className
          );
          viewTransitionHostInstanceIdx++;
        } else if (22 !== child.tag || null === child.memoizedState)
          (30 === child.tag && stopAtNestedViewTransitions) ||
            (applyViewTransitionToHostInstancesRecursive(
              child.child,
              name,
              className,
              collectMeasurements,
              stopAtNestedViewTransitions
            ) &&
              (inViewport = !0));
        child = child.sibling;
      }
      return inViewport;
    }
    function restoreViewTransitionOnHostInstances(
      child,
      stopAtNestedViewTransitions
    ) {
      if (supportsMutation)
        for (; null !== child; ) {
          if (5 === child.tag)
            restoreViewTransitionName(child.stateNode, child.memoizedProps);
          else if (22 !== child.tag || null === child.memoizedState)
            (30 === child.tag && stopAtNestedViewTransitions) ||
              restoreViewTransitionOnHostInstances(
                child.child,
                stopAtNestedViewTransitions
              );
          child = child.sibling;
        }
    }
    function commitAppearingPairViewTransitions(placement) {
      if (0 !== (placement.subtreeFlags & 18874368))
        for (placement = placement.child; null !== placement; ) {
          if (22 !== placement.tag || null !== placement.memoizedState)
            if (
              (commitAppearingPairViewTransitions(placement),
              30 === placement.tag &&
                0 !== (placement.flags & 18874368) &&
                placement.stateNode.paired)
            ) {
              var props = placement.memoizedProps;
              if (null == props.name || "auto" === props.name)
                throw Error(
                  "Found a pair with an auto name. This is a bug in React."
                );
              var name = props.name;
              props = getViewTransitionClassName(props.default, props.share);
              "none" !== props &&
                (applyViewTransitionToHostInstances(
                  placement,
                  name,
                  props,
                  null,
                  !1
                ) ||
                  restoreViewTransitionOnHostInstances(placement.child, !1));
            }
          placement = placement.sibling;
        }
    }
    function commitEnterViewTransitions(placement, gesture) {
      if (30 === placement.tag) {
        var state = placement.stateNode,
          props = placement.memoizedProps,
          name = getViewTransitionName(props, state),
          className = getViewTransitionClassName(
            props.default,
            state.paired ? props.share : props.enter
          );
        "none" !== className
          ? applyViewTransitionToHostInstances(
              placement,
              name,
              className,
              null,
              !1
            )
            ? (commitAppearingPairViewTransitions(placement),
              state.paired ||
                gesture ||
                scheduleViewTransitionEvent(placement, props.onEnter))
            : restoreViewTransitionOnHostInstances(placement.child, !1)
          : commitAppearingPairViewTransitions(placement);
      } else if (0 !== (placement.subtreeFlags & 33554432))
        for (placement = placement.child; null !== placement; )
          commitEnterViewTransitions(placement, gesture),
            (placement = placement.sibling);
      else commitAppearingPairViewTransitions(placement);
    }
    function commitDeletedPairViewTransitions(deletion) {
      if (
        null !== appearingViewTransitions &&
        0 !== appearingViewTransitions.size
      ) {
        var pairs = appearingViewTransitions;
        if (0 !== (deletion.subtreeFlags & 18874368))
          for (deletion = deletion.child; null !== deletion; ) {
            if (22 !== deletion.tag || null !== deletion.memoizedState) {
              if (30 === deletion.tag && 0 !== (deletion.flags & 18874368)) {
                var props = deletion.memoizedProps,
                  name = props.name;
                if (null != name && "auto" !== name) {
                  var pair = pairs.get(name);
                  if (void 0 !== pair) {
                    var className = getViewTransitionClassName(
                      props.default,
                      props.share
                    );
                    "none" !== className &&
                      (applyViewTransitionToHostInstances(
                        deletion,
                        name,
                        className,
                        null,
                        !1
                      )
                        ? ((className = deletion.stateNode),
                          (pair.paired = className),
                          (className.paired = pair),
                          scheduleViewTransitionEvent(deletion, props.onShare))
                        : restoreViewTransitionOnHostInstances(
                            deletion.child,
                            !1
                          ));
                    pairs.delete(name);
                    if (0 === pairs.size) break;
                  }
                }
              }
              commitDeletedPairViewTransitions(deletion);
            }
            deletion = deletion.sibling;
          }
      }
    }
    function commitExitViewTransitions(deletion) {
      if (30 === deletion.tag) {
        var props = deletion.memoizedProps,
          name = getViewTransitionName(props, deletion.stateNode),
          pair =
            null !== appearingViewTransitions
              ? appearingViewTransitions.get(name)
              : void 0,
          className = getViewTransitionClassName(
            props.default,
            void 0 !== pair ? props.share : props.exit
          );
        "none" !== className &&
          (applyViewTransitionToHostInstances(
            deletion,
            name,
            className,
            null,
            !1
          )
            ? void 0 !== pair
              ? ((className = deletion.stateNode),
                (pair.paired = className),
                (className.paired = pair),
                appearingViewTransitions.delete(name),
                scheduleViewTransitionEvent(deletion, props.onShare))
              : scheduleViewTransitionEvent(deletion, props.onExit)
            : restoreViewTransitionOnHostInstances(deletion.child, !1));
        null !== appearingViewTransitions &&
          commitDeletedPairViewTransitions(deletion);
      } else if (0 !== (deletion.subtreeFlags & 33554432))
        for (deletion = deletion.child; null !== deletion; )
          commitExitViewTransitions(deletion), (deletion = deletion.sibling);
      else
        null !== appearingViewTransitions &&
          commitDeletedPairViewTransitions(deletion);
    }
    function commitNestedViewTransitions(changedParent) {
      for (changedParent = changedParent.child; null !== changedParent; ) {
        if (30 === changedParent.tag) {
          var props = changedParent.memoizedProps,
            name = getViewTransitionName(props, changedParent.stateNode);
          props = getViewTransitionClassName(props.default, props.update);
          changedParent.flags &= -5;
          "none" !== props &&
            applyViewTransitionToHostInstances(
              changedParent,
              name,
              props,
              (changedParent.memoizedState = []),
              !1
            );
        } else
          0 !== (changedParent.subtreeFlags & 33554432) &&
            commitNestedViewTransitions(changedParent);
        changedParent = changedParent.sibling;
      }
    }
    function restorePairedViewTransitions(parent) {
      if (0 !== (parent.subtreeFlags & 18874368))
        for (parent = parent.child; null !== parent; ) {
          if (22 !== parent.tag || null !== parent.memoizedState) {
            if (30 === parent.tag && 0 !== (parent.flags & 18874368)) {
              var instance = parent.stateNode;
              null !== instance.paired &&
                ((instance.paired = null),
                restoreViewTransitionOnHostInstances(parent.child, !1));
            }
            restorePairedViewTransitions(parent);
          }
          parent = parent.sibling;
        }
    }
    function restoreEnterOrExitViewTransitions(fiber) {
      if (30 === fiber.tag)
        (fiber.stateNode.paired = null),
          restoreViewTransitionOnHostInstances(fiber.child, !1),
          restorePairedViewTransitions(fiber);
      else if (0 !== (fiber.subtreeFlags & 33554432))
        for (fiber = fiber.child; null !== fiber; )
          restoreEnterOrExitViewTransitions(fiber), (fiber = fiber.sibling);
      else restorePairedViewTransitions(fiber);
    }
    function restoreUpdateViewTransition(current, finishedWork) {
      restoreViewTransitionOnHostInstances(current.child, !0);
      restoreViewTransitionOnHostInstances(finishedWork.child, !0);
    }
    function restoreNestedViewTransitions(changedParent) {
      for (changedParent = changedParent.child; null !== changedParent; )
        30 === changedParent.tag
          ? restoreViewTransitionOnHostInstances(changedParent.child, !1)
          : 0 !== (changedParent.subtreeFlags & 33554432) &&
            restoreNestedViewTransitions(changedParent),
          (changedParent = changedParent.sibling);
    }
    function measureViewTransitionHostInstancesRecursive(
      parentViewTransition,
      child,
      newName,
      oldName,
      className,
      previousMeasurements,
      stopAtNestedViewTransitions
    ) {
      if (!supportsMutation) return !0;
      for (var inViewport = !1; null !== child; ) {
        if (5 === child.tag) {
          var instance = child.stateNode;
          if (
            null !== previousMeasurements &&
            viewTransitionHostInstanceIdx < previousMeasurements.length
          ) {
            var previousMeasurement =
                previousMeasurements[viewTransitionHostInstanceIdx],
              nextMeasurement = measureInstance(instance);
            if (
              wasInstanceInViewport(previousMeasurement) ||
              wasInstanceInViewport(nextMeasurement)
            )
              inViewport = !0;
            0 === (parentViewTransition.flags & 4) &&
              hasInstanceChanged(previousMeasurement, nextMeasurement) &&
              (parentViewTransition.flags |= 4);
            hasInstanceAffectedParent(previousMeasurement, nextMeasurement) &&
              (parentViewTransition.flags |= 32);
          } else parentViewTransition.flags |= 32;
          0 !== (parentViewTransition.flags & 4) &&
            applyViewTransitionName(
              instance,
              0 === viewTransitionHostInstanceIdx
                ? newName
                : newName + "_" + viewTransitionHostInstanceIdx,
              className
            );
          (inViewport && 0 !== (parentViewTransition.flags & 4)) ||
            (null === viewTransitionCancelableChildren &&
              (viewTransitionCancelableChildren = []),
            viewTransitionCancelableChildren.push(
              instance,
              oldName,
              child.memoizedProps
            ));
          viewTransitionHostInstanceIdx++;
        } else if (22 !== child.tag || null === child.memoizedState)
          30 === child.tag && stopAtNestedViewTransitions
            ? (parentViewTransition.flags |= child.flags & 32)
            : measureViewTransitionHostInstancesRecursive(
                parentViewTransition,
                child.child,
                newName,
                oldName,
                className,
                previousMeasurements,
                stopAtNestedViewTransitions
              ) && (inViewport = !0);
        child = child.sibling;
      }
      return inViewport;
    }
    function measureNestedViewTransitions(changedParent, gesture) {
      for (changedParent = changedParent.child; null !== changedParent; ) {
        if (30 === changedParent.tag) {
          var props = changedParent.memoizedProps,
            state = changedParent.stateNode,
            name = getViewTransitionName(props, state),
            className = getViewTransitionClassName(props.default, props.update);
          if (gesture) {
            state = state.clones;
            var previousMeasurements =
              null === state ? null : state.map(measureClonedInstance);
          } else
            (previousMeasurements = changedParent.memoizedState),
              (changedParent.memoizedState = null);
          state = changedParent;
          var child = changedParent.child,
            newName = name;
          viewTransitionHostInstanceIdx = 0;
          className = measureViewTransitionHostInstancesRecursive(
            state,
            child,
            newName,
            name,
            className,
            previousMeasurements,
            !1
          );
          0 !== (changedParent.flags & 4) &&
            className &&
            (gesture ||
              scheduleViewTransitionEvent(changedParent, props.onUpdate));
        } else
          0 !== (changedParent.subtreeFlags & 33554432) &&
            measureNestedViewTransitions(changedParent, gesture);
        changedParent = changedParent.sibling;
      }
    }
    function trackNamedViewTransition(fiber) {
      var name = fiber.memoizedProps.name;
      if (null != name && "auto" !== name) {
        var existing = mountedNamedViewTransitions.get(name);
        if (void 0 !== existing) {
          if (
            existing !== fiber &&
            existing !== fiber.alternate &&
            !didWarnAboutName[name]
          ) {
            didWarnAboutName[name] = !0;
            var stringifiedName = JSON.stringify(name);
            runWithFiberInDEV(fiber, function () {
              console.error(
                "There are two <ViewTransition name=%s> components with the same name mounted at the same time. This is not supported and will cause View Transitions to error. Try to use a more unique name e.g. by using a namespace prefix and adding the id of an item to the name.",
                stringifiedName
              );
            });
            runWithFiberInDEV(existing, function () {
              console.error(
                "The existing <ViewTransition name=%s> duplicate has this stack trace.",
                stringifiedName
              );
            });
          }
        } else mountedNamedViewTransitions.set(name, fiber);
      }
    }
    function untrackNamedViewTransition(fiber) {
      var name = fiber.memoizedProps.name;
      if (null != name && "auto" !== name) {
        var existing = mountedNamedViewTransitions.get(name);
        void 0 === existing ||
          (existing !== fiber && existing !== fiber.alternate) ||
          mountedNamedViewTransitions.delete(name);
      }
    }
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
            ? current.memoizedState.isDehydrated &&
              0 === (finishedWork.flags & 256)
            : !1;
    }
    function commitBeforeMutationEffects(root, firstChild, committedLanes) {
      focusedInstanceHandle = prepareForCommit(root.containerInfo);
      shouldFireAfterActiveInstanceBlur = !1;
      root =
        enableViewTransition && (committedLanes & 335544064) === committedLanes;
      nextEffect = firstChild;
      for (firstChild = root ? 9270 : 9236; null !== nextEffect; ) {
        committedLanes = nextEffect;
        var deletions = committedLanes.deletions;
        if (null !== deletions)
          for (var i = 0; i < deletions.length; i++) {
            var deletion = deletions[i],
              isViewTransitionEligible = root;
            doesFiberContain(deletion, focusedInstanceHandle) &&
              ((shouldFireAfterActiveInstanceBlur = !0),
              beforeActiveInstanceBlur(deletion));
            isViewTransitionEligible && commitExitViewTransitions(deletion);
          }
        if (
          enableViewTransition &&
          null === committedLanes.alternate &&
          0 !== (committedLanes.flags & 2)
        )
          root && trackEnterViewTransitions(committedLanes),
            commitBeforeMutationEffects_complete(root);
        else {
          if (enableViewTransition && 22 === committedLanes.tag)
            if (
              ((deletions = committedLanes.alternate),
              null !== committedLanes.memoizedState)
            ) {
              null !== deletions &&
                null === deletions.memoizedState &&
                root &&
                commitExitViewTransitions(deletions);
              commitBeforeMutationEffects_complete(root);
              continue;
            } else if (null !== deletions && null !== deletions.memoizedState) {
              root && trackEnterViewTransitions(committedLanes);
              commitBeforeMutationEffects_complete(root);
              continue;
            }
          deletions = committedLanes.child;
          0 !== (committedLanes.subtreeFlags & firstChild) && null !== deletions
            ? ((deletions.return = committedLanes), (nextEffect = deletions))
            : (root && commitNestedViewTransitions(committedLanes),
              commitBeforeMutationEffects_complete(root));
        }
      }
      appearingViewTransitions = focusedInstanceHandle = null;
    }
    function commitBeforeMutationEffects_complete(
      isViewTransitionEligible$jscomp$0
    ) {
      for (; null !== nextEffect; ) {
        var fiber = nextEffect,
          finishedWork = fiber,
          isViewTransitionEligible = isViewTransitionEligible$jscomp$0,
          current = finishedWork.alternate,
          flags = finishedWork.flags,
          JSCompiler_temp;
        if (
          (JSCompiler_temp =
            !shouldFireAfterActiveInstanceBlur &&
            null !== focusedInstanceHandle)
        ) {
          if ((JSCompiler_temp = 13 === finishedWork.tag))
            a: {
              if (
                null !== current &&
                ((JSCompiler_temp = current.memoizedState),
                null === JSCompiler_temp || null !== JSCompiler_temp.dehydrated)
              ) {
                JSCompiler_temp = finishedWork.memoizedState;
                JSCompiler_temp =
                  null !== JSCompiler_temp &&
                  null === JSCompiler_temp.dehydrated;
                break a;
              }
              JSCompiler_temp = !1;
            }
          JSCompiler_temp =
            JSCompiler_temp &&
            doesFiberContain(finishedWork, focusedInstanceHandle);
        }
        JSCompiler_temp &&
          ((shouldFireAfterActiveInstanceBlur = !0),
          beforeActiveInstanceBlur(finishedWork));
        switch (finishedWork.tag) {
          case 0:
          case 11:
          case 15:
            if (
              0 !== (flags & 4) &&
              ((finishedWork = finishedWork.updateQueue),
              (finishedWork =
                null !== finishedWork ? finishedWork.events : null),
              null !== finishedWork)
            )
              for (
                isViewTransitionEligible = 0;
                isViewTransitionEligible < finishedWork.length;
                isViewTransitionEligible++
              )
                (current = finishedWork[isViewTransitionEligible]),
                  (current.ref.impl = current.nextImpl);
            break;
          case 1:
            0 !== (flags & 1024) &&
              null !== current &&
              commitClassSnapshot(finishedWork, current);
            break;
          case 3:
            0 !== (flags & 1024) &&
              supportsMutation &&
              clearContainer(finishedWork.stateNode.containerInfo);
            break;
          case 5:
          case 26:
          case 27:
          case 6:
          case 4:
          case 17:
            break;
          case 30:
            if (enableViewTransition) {
              isViewTransitionEligible &&
                null !== current &&
                ((isViewTransitionEligible = current),
                (current = finishedWork),
                (finishedWork = getViewTransitionName(
                  isViewTransitionEligible.memoizedProps,
                  isViewTransitionEligible.stateNode
                )),
                (current = current.memoizedProps),
                (current = getViewTransitionClassName(
                  current.default,
                  current.update
                )),
                "none" !== current &&
                  applyViewTransitionToHostInstances(
                    isViewTransitionEligible,
                    finishedWork,
                    current,
                    (isViewTransitionEligible.memoizedState = []),
                    !0
                  ));
              break;
            }
          default:
            if (0 !== (flags & 1024))
              throw Error(
                "This unit of work tag should not have side-effects. This error is likely caused by a bug in React. Please file an issue."
              );
        }
        finishedWork = fiber.sibling;
        if (null !== finishedWork) {
          finishedWork.return = fiber.return;
          nextEffect = finishedWork;
          break;
        }
        nextEffect = fiber.return;
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
          flags & 4 &&
            commitHookLayoutEffects(finishedWork, Layout | HasEffect);
          break;
        case 1:
          recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
          if (flags & 4)
            if (((finishedRoot = finishedWork.stateNode), null === current))
              finishedWork.type.defaultProps ||
                "ref" in finishedWork.memoizedProps ||
                didWarnAboutReassigningProps ||
                (finishedRoot.props !== finishedWork.memoizedProps &&
                  console.error(
                    "Expected %s props to match memoized props before componentDidMount. This might either be because of a bug in React, or because a component reassigns its own `this.props`. Please file an issue.",
                    getComponentNameFromFiber(finishedWork) || "instance"
                  ),
                finishedRoot.state !== finishedWork.memoizedState &&
                  console.error(
                    "Expected %s state to match memoized state before componentDidMount. This might either be because of a bug in React, or because a component reassigns its own `this.state`. Please file an issue.",
                    getComponentNameFromFiber(finishedWork) || "instance"
                  )),
                shouldProfile(finishedWork)
                  ? (startEffectTimer(),
                    runWithFiberInDEV(
                      finishedWork,
                      callComponentDidMountInDEV,
                      finishedWork,
                      finishedRoot
                    ),
                    recordEffectDuration())
                  : runWithFiberInDEV(
                      finishedWork,
                      callComponentDidMountInDEV,
                      finishedWork,
                      finishedRoot
                    );
            else {
              var prevProps = resolveClassComponentProps(
                finishedWork.type,
                current.memoizedProps
              );
              current = current.memoizedState;
              finishedWork.type.defaultProps ||
                "ref" in finishedWork.memoizedProps ||
                didWarnAboutReassigningProps ||
                (finishedRoot.props !== finishedWork.memoizedProps &&
                  console.error(
                    "Expected %s props to match memoized props before componentDidUpdate. This might either be because of a bug in React, or because a component reassigns its own `this.props`. Please file an issue.",
                    getComponentNameFromFiber(finishedWork) || "instance"
                  ),
                finishedRoot.state !== finishedWork.memoizedState &&
                  console.error(
                    "Expected %s state to match memoized state before componentDidUpdate. This might either be because of a bug in React, or because a component reassigns its own `this.state`. Please file an issue.",
                    getComponentNameFromFiber(finishedWork) || "instance"
                  ));
              shouldProfile(finishedWork)
                ? (startEffectTimer(),
                  runWithFiberInDEV(
                    finishedWork,
                    callComponentDidUpdateInDEV,
                    finishedWork,
                    finishedRoot,
                    prevProps,
                    current,
                    finishedRoot.__reactInternalSnapshotBeforeUpdate
                  ),
                  recordEffectDuration())
                : runWithFiberInDEV(
                    finishedWork,
                    callComponentDidUpdateInDEV,
                    finishedWork,
                    finishedRoot,
                    prevProps,
                    current,
                    finishedRoot.__reactInternalSnapshotBeforeUpdate
                  );
            }
          flags & 64 && commitClassCallbacks(finishedWork);
          flags & 512 && safelyAttachRef(finishedWork, finishedWork.return);
          break;
        case 3:
          current = pushNestedEffectDurations();
          recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
          if (
            flags & 64 &&
            ((flags = finishedWork.updateQueue), null !== flags)
          ) {
            prevProps = null;
            if (null !== finishedWork.child)
              switch (finishedWork.child.tag) {
                case 27:
                case 5:
                  prevProps = getPublicInstance(finishedWork.child.stateNode);
                  break;
                case 1:
                  prevProps = finishedWork.child.stateNode;
              }
            try {
              runWithFiberInDEV(
                finishedWork,
                commitCallbacks,
                flags,
                prevProps
              );
            } catch (error) {
              captureCommitPhaseError(finishedWork, finishedWork.return, error);
            }
          }
          finishedRoot.effectDuration += popNestedEffectDurations(current);
          break;
        case 27:
          supportsSingletons &&
            null === current &&
            flags & 4 &&
            commitHostSingletonAcquisition(finishedWork);
        case 26:
        case 5:
          recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
          if (null === current)
            if (flags & 4) commitHostMount(finishedWork);
            else if (flags & 64) {
              finishedRoot = finishedWork.type;
              current = finishedWork.memoizedProps;
              prevProps = finishedWork.stateNode;
              try {
                runWithFiberInDEV(
                  finishedWork,
                  commitHydratedInstance,
                  prevProps,
                  finishedRoot,
                  current,
                  finishedWork
                );
              } catch (error) {
                captureCommitPhaseError(
                  finishedWork,
                  finishedWork.return,
                  error
                );
              }
            }
          flags & 512 && safelyAttachRef(finishedWork, finishedWork.return);
          break;
        case 12:
          if (flags & 4) {
            flags = pushNestedEffectDurations();
            recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
            finishedRoot = finishedWork.stateNode;
            finishedRoot.effectDuration += bubbleNestedEffectDurations(flags);
            try {
              runWithFiberInDEV(
                finishedWork,
                commitProfiler,
                finishedWork,
                current,
                commitStartTime,
                finishedRoot.effectDuration
              );
            } catch (error) {
              captureCommitPhaseError(finishedWork, finishedWork.return, error);
            }
          } else recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
          break;
        case 31:
          recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
          flags & 4 &&
            commitActivityHydrationCallbacks(finishedRoot, finishedWork);
          break;
        case 13:
          recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
          flags & 4 &&
            commitSuspenseHydrationCallbacks(finishedRoot, finishedWork);
          flags & 64 &&
            ((finishedRoot = finishedWork.memoizedState),
            null !== finishedRoot &&
              ((finishedRoot = finishedRoot.dehydrated),
              null !== finishedRoot &&
                ((flags = retryDehydratedSuspenseBoundary.bind(
                  null,
                  finishedWork
                )),
                registerSuspenseInstanceRetry(finishedRoot, flags))));
          break;
        case 22:
          flags =
            null !== finishedWork.memoizedState || offscreenSubtreeIsHidden;
          if (!flags) {
            current =
              (null !== current && null !== current.memoizedState) ||
              offscreenSubtreeWasHidden;
            prevProps = offscreenSubtreeIsHidden;
            var prevOffscreenSubtreeWasHidden = offscreenSubtreeWasHidden;
            offscreenSubtreeIsHidden = flags;
            (offscreenSubtreeWasHidden = current) &&
            !prevOffscreenSubtreeWasHidden
              ? (recursivelyTraverseReappearLayoutEffects(
                  finishedRoot,
                  finishedWork,
                  0 !== (finishedWork.subtreeFlags & 8772)
                ),
                enableComponentPerformanceTrack &&
                  (finishedWork.mode & 2) !== NoMode &&
                  0 <= componentEffectStartTime &&
                  0 <= componentEffectEndTime &&
                  0.05 < componentEffectEndTime - componentEffectStartTime &&
                  logComponentReappeared(
                    finishedWork,
                    componentEffectStartTime,
                    componentEffectEndTime
                  ))
              : recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
            offscreenSubtreeIsHidden = prevProps;
            offscreenSubtreeWasHidden = prevOffscreenSubtreeWasHidden;
          }
          break;
        case 30:
          enableViewTransition &&
            (flags & 18874368 && trackNamedViewTransition(finishedWork),
            recursivelyTraverseLayoutEffects(finishedRoot, finishedWork),
            flags & 512 && safelyAttachRef(finishedWork, finishedWork.return));
          break;
        case 7:
          enableFragmentRefs &&
            flags & 512 &&
            safelyAttachRef(finishedWork, finishedWork.return);
        default:
          recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
      }
      enableComponentPerformanceTrack &&
        (finishedWork.mode & 2) !== NoMode &&
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
          (isHydratingParent(
            finishedWork.return.alternate,
            finishedWork.return
          ) ||
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
    function abortRootTransitions(
      root,
      abort,
      deletedTransitions,
      deletedOffscreenInstance
    ) {
      if (enableTransitionTracing) {
        var rootTransitions = root.incompleteTransitions;
        deletedTransitions.forEach(function (transition) {
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
          deletedTransitions.forEach(function (transition) {
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
                    (currentPendingTransitionCallbacks.markerIncomplete =
                      new Map()),
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
          offscreenFiber.memoizedProps.name &&
          (name = offscreenFiber.memoizedProps.name);
        !prevState && previousFiber
          ? null !== pendingMarkers &&
            pendingMarkers.forEach(function (markerInstance) {
              var pendingBoundaries = markerInstance.pendingBoundaries,
                transitions = markerInstance.transitions,
                markerName = markerInstance.name;
              null === pendingBoundaries ||
                pendingBoundaries.has(offscreenInstance) ||
                (pendingBoundaries.set(offscreenInstance, { name: name }),
                null !== transitions &&
                  (markerInstance.tag === TransitionTracingMarker &&
                  null !== markerName
                    ? addMarkerProgressCallbackToPendingTransition(
                        markerName,
                        transitions,
                        pendingBoundaries
                      )
                    : markerInstance.tag === TransitionRoot &&
                      transitions.forEach(function (transition) {
                        addTransitionProgressCallbackToPendingTransition(
                          transition,
                          pendingBoundaries
                        );
                      })));
            })
          : prevState &&
            !previousFiber &&
            null !== pendingMarkers &&
            pendingMarkers.forEach(function (markerInstance) {
              var pendingBoundaries = markerInstance.pendingBoundaries,
                transitions = markerInstance.transitions,
                markerName = markerInstance.name;
              null !== pendingBoundaries &&
                pendingBoundaries.has(offscreenInstance) &&
                (pendingBoundaries.delete(offscreenInstance),
                null !== transitions &&
                  (markerInstance.tag === TransitionTracingMarker &&
                  null !== markerName
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
                    : markerInstance.tag === TransitionRoot &&
                      transitions.forEach(function (transition) {
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
      5 === fiber.tag &&
        ((alternate = fiber.stateNode),
        null !== alternate && detachDeletedInstance(alternate));
      fiber.stateNode = null;
      fiber._debugOwner = null;
      fiber.return = null;
      fiber.dependencies = null;
      fiber.memoizedProps = null;
      fiber.memoizedState = null;
      fiber.pendingProps = null;
      fiber.stateNode = null;
      fiber.updateQueue = null;
    }
    function recursivelyTraverseDeletionEffects(
      finishedRoot,
      nearestMountedAncestor,
      parent
    ) {
      for (parent = parent.child; null !== parent; )
        commitDeletionEffectsOnFiber(
          finishedRoot,
          nearestMountedAncestor,
          parent
        ),
          (parent = parent.sibling);
    }
    function commitDeletionEffectsOnFiber(
      finishedRoot,
      nearestMountedAncestor,
      deletedFiber
    ) {
      if (
        injectedHook &&
        "function" === typeof injectedHook.onCommitFiberUnmount
      )
        try {
          injectedHook.onCommitFiberUnmount(rendererID, deletedFiber);
        } catch (err) {
          hasLoggedError ||
            ((hasLoggedError = !0),
            console.error(
              "React instrumentation encountered an error: %o",
              err
            ));
        }
      var prevEffectStart = pushComponentEffectStart(),
        prevEffectDuration = pushComponentEffectDuration(),
        prevEffectErrors = pushComponentEffectErrors(),
        prevEffectDidSpawnUpdate = pushComponentEffectDidSpawnUpdate();
      switch (deletedFiber.tag) {
        case 26:
          if (supportsResources) {
            offscreenSubtreeWasHidden ||
              safelyDetachRef(deletedFiber, nearestMountedAncestor);
            recursivelyTraverseDeletionEffects(
              finishedRoot,
              nearestMountedAncestor,
              deletedFiber
            );
            deletedFiber.memoizedState
              ? releaseResource(deletedFiber.memoizedState)
              : deletedFiber.stateNode &&
                unmountHoistable(deletedFiber.stateNode);
            break;
          }
        case 27:
          if (supportsSingletons) {
            offscreenSubtreeWasHidden ||
              safelyDetachRef(deletedFiber, nearestMountedAncestor);
            var prevHostParent = hostParent,
              prevHostParentIsContainer = hostParentIsContainer;
            isSingletonScope(deletedFiber.type) &&
              ((hostParent = deletedFiber.stateNode),
              (hostParentIsContainer = !1));
            recursivelyTraverseDeletionEffects(
              finishedRoot,
              nearestMountedAncestor,
              deletedFiber
            );
            runWithFiberInDEV(
              deletedFiber,
              releaseSingletonInstance,
              deletedFiber.stateNode
            );
            hostParent = prevHostParent;
            hostParentIsContainer = prevHostParentIsContainer;
            break;
          }
        case 5:
          offscreenSubtreeWasHidden ||
            safelyDetachRef(deletedFiber, nearestMountedAncestor),
            enableFragmentRefs &&
              5 === deletedFiber.tag &&
              commitFragmentInstanceDeletionEffects(deletedFiber);
        case 6:
          if (supportsMutation) {
            if (
              ((prevHostParent = hostParent),
              (prevHostParentIsContainer = hostParentIsContainer),
              (hostParent = null),
              recursivelyTraverseDeletionEffects(
                finishedRoot,
                nearestMountedAncestor,
                deletedFiber
              ),
              (hostParent = prevHostParent),
              (hostParentIsContainer = prevHostParentIsContainer),
              null !== hostParent)
            )
              if (hostParentIsContainer)
                try {
                  runWithFiberInDEV(
                    deletedFiber,
                    removeChildFromContainer,
                    hostParent,
                    deletedFiber.stateNode
                  ),
                    trackHostMutation();
                } catch (error) {
                  captureCommitPhaseError(
                    deletedFiber,
                    nearestMountedAncestor,
                    error
                  );
                }
              else
                try {
                  runWithFiberInDEV(
                    deletedFiber,
                    removeChild,
                    hostParent,
                    deletedFiber.stateNode
                  ),
                    trackHostMutation();
                } catch (error) {
                  captureCommitPhaseError(
                    deletedFiber,
                    nearestMountedAncestor,
                    error
                  );
                }
          } else
            recursivelyTraverseDeletionEffects(
              finishedRoot,
              nearestMountedAncestor,
              deletedFiber
            );
          break;
        case 18:
          finishedRoot = finishedRoot.hydrationCallbacks;
          if (null !== finishedRoot)
            try {
              (prevHostParent = finishedRoot.onDeleted) &&
                prevHostParent(deletedFiber.stateNode);
            } catch (error) {
              captureCommitPhaseError(
                deletedFiber,
                nearestMountedAncestor,
                error
              );
            }
          supportsMutation &&
            null !== hostParent &&
            (hostParentIsContainer
              ? clearSuspenseBoundaryFromContainer(
                  hostParent,
                  deletedFiber.stateNode
                )
              : clearSuspenseBoundary(hostParent, deletedFiber.stateNode));
          break;
        case 4:
          supportsMutation
            ? ((prevHostParent = hostParent),
              (prevHostParentIsContainer = hostParentIsContainer),
              (hostParent = deletedFiber.stateNode.containerInfo),
              (hostParentIsContainer = !0),
              recursivelyTraverseDeletionEffects(
                finishedRoot,
                nearestMountedAncestor,
                deletedFiber
              ),
              (hostParent = prevHostParent),
              (hostParentIsContainer = prevHostParentIsContainer))
            : (supportsPersistence &&
                commitHostPortalContainerChildren(
                  deletedFiber.stateNode,
                  deletedFiber,
                  createContainerChildSet()
                ),
              recursivelyTraverseDeletionEffects(
                finishedRoot,
                nearestMountedAncestor,
                deletedFiber
              ));
          break;
        case 0:
        case 11:
        case 14:
        case 15:
          (!enableHiddenSubtreeInsertionEffectCleanup &&
            offscreenSubtreeWasHidden) ||
            commitHookEffectListUnmount(
              Insertion,
              deletedFiber,
              nearestMountedAncestor
            );
          offscreenSubtreeWasHidden ||
            commitHookLayoutUnmountEffects(
              deletedFiber,
              nearestMountedAncestor,
              Layout
            );
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
          offscreenSubtreeWasHidden ||
            safelyDetachRef(deletedFiber, nearestMountedAncestor);
          recursivelyTraverseDeletionEffects(
            finishedRoot,
            nearestMountedAncestor,
            deletedFiber
          );
          break;
        case 22:
          offscreenSubtreeWasHidden =
            (prevHostParent = offscreenSubtreeWasHidden) ||
            null !== deletedFiber.memoizedState;
          recursivelyTraverseDeletionEffects(
            finishedRoot,
            nearestMountedAncestor,
            deletedFiber
          );
          offscreenSubtreeWasHidden = prevHostParent;
          break;
        case 30:
          if (enableViewTransition) {
            deletedFiber.flags & 18874368 &&
              untrackNamedViewTransition(deletedFiber);
            safelyDetachRef(deletedFiber, nearestMountedAncestor);
            recursivelyTraverseDeletionEffects(
              finishedRoot,
              nearestMountedAncestor,
              deletedFiber
            );
            break;
          }
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
        (deletedFiber.mode & 2) !== NoMode &&
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
      if (supportsHydration && null === finishedWork.memoizedState) {
        var current = finishedWork.alternate;
        if (
          null !== current &&
          ((current = current.memoizedState), null !== current)
        ) {
          current = current.dehydrated;
          try {
            runWithFiberInDEV(
              finishedWork,
              commitHydratedActivityInstance,
              current
            );
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
      if (supportsHydration && null === finishedWork.memoizedState) {
        var current = finishedWork.alternate;
        if (
          null !== current &&
          ((current = current.memoizedState),
          null !== current &&
            ((current = current.dehydrated), null !== current))
        ) {
          try {
            runWithFiberInDEV(
              finishedWork,
              commitHydratedSuspenseInstance,
              current
            );
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
          throw Error(
            "Unexpected Suspense handler tag (" +
              finishedWork.tag +
              "). This is a bug in React."
          );
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
            else
              throw Error(
                "Expected finished root and lanes to be set. This is a bug in React."
              );
          var retry = resolveRetryWakeable.bind(null, finishedWork, wakeable);
          wakeable.then(retry, retry);
        }
      });
    }
    function recursivelyTraverseMutationEffects(
      root$jscomp$0,
      parentFiber,
      lanes
    ) {
      var deletions = parentFiber.deletions;
      if (null !== deletions)
        for (var i = 0; i < deletions.length; i++) {
          var root = root$jscomp$0,
            returnFiber = parentFiber,
            deletedFiber = deletions[i],
            prevEffectStart = pushComponentEffectStart();
          if (supportsMutation) {
            var parent = returnFiber;
            a: for (; null !== parent; ) {
              switch (parent.tag) {
                case 27:
                  if (supportsSingletons) {
                    if (isSingletonScope(parent.type)) {
                      hostParent = parent.stateNode;
                      hostParentIsContainer = !1;
                      break a;
                    }
                    break;
                  }
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
            if (null === hostParent)
              throw Error(
                "Expected to find a host parent. This error is likely caused by a bug in React. Please file an issue."
              );
            commitDeletionEffectsOnFiber(root, returnFiber, deletedFiber);
            hostParent = null;
            hostParentIsContainer = !1;
          } else commitDeletionEffectsOnFiber(root, returnFiber, deletedFiber);
          enableComponentPerformanceTrack &&
            (deletedFiber.mode & 2) !== NoMode &&
            0 <= componentEffectStartTime &&
            0 <= componentEffectEndTime &&
            0.05 < componentEffectEndTime - componentEffectStartTime &&
            logComponentTrigger(
              deletedFiber,
              componentEffectStartTime,
              componentEffectEndTime,
              "Unmount"
            );
          popComponentEffectStart(prevEffectStart);
          root = deletedFiber;
          returnFiber = root.alternate;
          null !== returnFiber && (returnFiber.return = null);
          root.return = null;
        }
      if (parentFiber.subtreeFlags & 13886)
        for (parentFiber = parentFiber.child; null !== parentFiber; )
          commitMutationEffectsOnFiber(parentFiber, root$jscomp$0, lanes),
            (parentFiber = parentFiber.sibling);
    }
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
            (commitHookEffectListUnmount(
              Insertion | HasEffect,
              finishedWork,
              finishedWork.return
            ),
            commitHookEffectListMount(Insertion | HasEffect, finishedWork),
            commitHookLayoutUnmountEffects(
              finishedWork,
              finishedWork.return,
              Layout | HasEffect
            ));
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
          if (supportsResources) {
            var hoistableRoot = currentHoistableRoot;
            recursivelyTraverseMutationEffects(root, finishedWork, lanes);
            commitReconciliationEffects(finishedWork);
            flags & 512 &&
              (offscreenSubtreeWasHidden ||
                null === current ||
                safelyDetachRef(current, current.return));
            flags & 4 &&
              ((flags = null !== current ? current.memoizedState : null),
              (root = finishedWork.memoizedState),
              null === current
                ? null === root
                  ? null === finishedWork.stateNode
                    ? (finishedWork.stateNode = hydrateHoistable(
                        hoistableRoot,
                        finishedWork.type,
                        finishedWork.memoizedProps,
                        finishedWork
                      ))
                    : mountHoistable(
                        hoistableRoot,
                        finishedWork.type,
                        finishedWork.stateNode
                      )
                  : (finishedWork.stateNode = acquireResource(
                      hoistableRoot,
                      root,
                      finishedWork.memoizedProps
                    ))
                : flags !== root
                  ? (null === flags
                      ? null !== current.stateNode &&
                        unmountHoistable(current.stateNode)
                      : releaseResource(flags),
                    null === root
                      ? mountHoistable(
                          hoistableRoot,
                          finishedWork.type,
                          finishedWork.stateNode
                        )
                      : acquireResource(
                          hoistableRoot,
                          root,
                          finishedWork.memoizedProps
                        ))
                  : null === root &&
                    null !== finishedWork.stateNode &&
                    commitHostUpdate(
                      finishedWork,
                      finishedWork.memoizedProps,
                      current.memoizedProps
                    ));
            break;
          }
        case 27:
          if (supportsSingletons) {
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
          }
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
          if (supportsMutation) {
            if (finishedWork.flags & 32) {
              root = finishedWork.stateNode;
              try {
                runWithFiberInDEV(finishedWork, resetTextContent, root),
                  trackHostMutation();
              } catch (error) {
                captureCommitPhaseError(
                  finishedWork,
                  finishedWork.return,
                  error
                );
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
            flags & 1024 &&
              ((needsFormReset = !0),
              "form" !== finishedWork.type &&
                console.error(
                  "Unexpected host component type. Expected a form. This is a bug in React."
                ));
          } else
            supportsPersistence &&
              null !== finishedWork.alternate &&
              (finishedWork.alternate.stateNode = finishedWork.stateNode);
          break;
        case 6:
          recursivelyTraverseMutationEffects(root, finishedWork, lanes);
          commitReconciliationEffects(finishedWork);
          if (flags & 4 && supportsMutation) {
            if (null === finishedWork.stateNode)
              throw Error(
                "This should have a text node initialized. This error is likely caused by a bug in React. Please file an issue."
              );
            flags = finishedWork.memoizedProps;
            current = null !== current ? current.memoizedProps : flags;
            root = finishedWork.stateNode;
            try {
              runWithFiberInDEV(
                finishedWork,
                commitTextUpdate,
                root,
                current,
                flags
              ),
                trackHostMutation();
            } catch (error) {
              captureCommitPhaseError(finishedWork, finishedWork.return, error);
            }
          }
          break;
        case 3:
          hoistableRoot = pushNestedEffectDurations();
          rootMutationContext = !1;
          enableViewTransition && (viewTransitionMutationContext = !1);
          if (supportsResources) {
            prepareToCommitHoistables();
            var previousHoistableRoot = currentHoistableRoot;
            currentHoistableRoot = getHoistableRoot(root.containerInfo);
            recursivelyTraverseMutationEffects(root, finishedWork, lanes);
            currentHoistableRoot = previousHoistableRoot;
          } else recursivelyTraverseMutationEffects(root, finishedWork, lanes);
          commitReconciliationEffects(finishedWork);
          if (flags & 4) {
            if (
              supportsMutation &&
              supportsHydration &&
              null !== current &&
              current.memoizedState.isDehydrated
            )
              try {
                runWithFiberInDEV(
                  finishedWork,
                  commitHydratedContainer,
                  root.containerInfo
                );
              } catch (error) {
                captureCommitPhaseError(
                  finishedWork,
                  finishedWork.return,
                  error
                );
              }
            if (supportsPersistence) {
              flags = root.containerInfo;
              current = root.pendingChildren;
              try {
                runWithFiberInDEV(
                  finishedWork,
                  replaceContainerChildren,
                  flags,
                  current
                ),
                  trackHostMutation();
              } catch (error) {
                captureCommitPhaseError(
                  finishedWork,
                  finishedWork.return,
                  error
                );
              }
            }
          }
          needsFormReset &&
            ((needsFormReset = !1), recursivelyResetForms(finishedWork));
          root.effectDuration += popNestedEffectDurations(hoistableRoot);
          popMutationContext(!1);
          rootMutationContext &&
            0 !== (lanes & 34) &&
            ((root.indicatorLanes &= ~currentEventTransitionLane),
            (needsIsomorphicIndicator = !1));
          break;
        case 4:
          current = pushMutationContext();
          supportsResources
            ? ((hoistableRoot = currentHoistableRoot),
              (currentHoistableRoot = getHoistableRoot(
                finishedWork.stateNode.containerInfo
              )),
              recursivelyTraverseMutationEffects(root, finishedWork, lanes),
              commitReconciliationEffects(finishedWork),
              (currentHoistableRoot = hoistableRoot))
            : (recursivelyTraverseMutationEffects(root, finishedWork, lanes),
              commitReconciliationEffects(finishedWork));
          viewTransitionMutationContext &&
            inUpdateViewTransition &&
            (rootViewTransitionAffected = !0);
          popMutationContext(current);
          flags & 4 &&
            supportsPersistence &&
            commitHostPortalContainerChildren(
              finishedWork.stateNode,
              finishedWork,
              finishedWork.stateNode.pendingChildren
            );
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
                var suspenseCallback =
                  finishedWork.memoizedProps.suspenseCallback;
                if ("function" === typeof suspenseCallback) {
                  var retryQueue = finishedWork.updateQueue;
                  null !== retryQueue && suspenseCallback(new Set(retryQueue));
                } else
                  void 0 !== suspenseCallback &&
                    console.error("Unexpected type for suspenseCallback.");
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
          var prevOffscreenSubtreeIsHidden = offscreenSubtreeIsHidden,
            prevOffscreenSubtreeWasHidden = offscreenSubtreeWasHidden,
            _prevOffscreenDirectParentIsHidden = offscreenDirectParentIsHidden;
          offscreenSubtreeIsHidden =
            prevOffscreenSubtreeIsHidden || suspenseCallback;
          offscreenDirectParentIsHidden =
            _prevOffscreenDirectParentIsHidden || suspenseCallback;
          offscreenSubtreeWasHidden =
            prevOffscreenSubtreeWasHidden || retryQueue;
          recursivelyTraverseMutationEffects(root, finishedWork, lanes);
          offscreenSubtreeWasHidden = prevOffscreenSubtreeWasHidden;
          offscreenDirectParentIsHidden = _prevOffscreenDirectParentIsHidden;
          offscreenSubtreeIsHidden = prevOffscreenSubtreeIsHidden;
          retryQueue &&
            !suspenseCallback &&
            !prevOffscreenSubtreeIsHidden &&
            !prevOffscreenSubtreeWasHidden &&
            enableComponentPerformanceTrack &&
            (finishedWork.mode & 2) !== NoMode &&
            0 <= componentEffectStartTime &&
            0 <= componentEffectEndTime &&
            0.05 < componentEffectEndTime - componentEffectStartTime &&
            logComponentReappeared(
              finishedWork,
              componentEffectStartTime,
              componentEffectEndTime
            );
          commitReconciliationEffects(finishedWork);
          if (
            flags & 8192 &&
            ((root = finishedWork.stateNode),
            (root._visibility = suspenseCallback
              ? root._visibility & ~OffscreenVisible
              : root._visibility | OffscreenVisible),
            !suspenseCallback ||
              null === current ||
              retryQueue ||
              offscreenSubtreeIsHidden ||
              offscreenSubtreeWasHidden ||
              (recursivelyTraverseDisappearLayoutEffects(finishedWork),
              enableComponentPerformanceTrack &&
                (finishedWork.mode & 2) !== NoMode &&
                0 <= componentEffectStartTime &&
                0 <= componentEffectEndTime &&
                0.05 < componentEffectEndTime - componentEffectStartTime &&
                logComponentTrigger(
                  finishedWork,
                  componentEffectStartTime,
                  componentEffectEndTime,
                  "Disconnect"
                )),
            supportsMutation &&
              (suspenseCallback || !offscreenDirectParentIsHidden))
          )
            a: if (((current = null), supportsMutation))
              for (root = finishedWork; ; ) {
                if (5 === root.tag || (supportsResources && 26 === root.tag)) {
                  if (null === current) {
                    lanes = current = root;
                    try {
                      (hoistableRoot = lanes.stateNode),
                        suspenseCallback
                          ? runWithFiberInDEV(
                              lanes,
                              hideInstance,
                              hoistableRoot
                            )
                          : runWithFiberInDEV(
                              lanes,
                              unhideInstance,
                              lanes.stateNode,
                              lanes.memoizedProps
                            );
                    } catch (error) {
                      captureCommitPhaseError(lanes, lanes.return, error);
                    }
                  }
                } else if (6 === root.tag) {
                  if (null === current) {
                    lanes = root;
                    try {
                      (previousHoistableRoot = lanes.stateNode),
                        suspenseCallback
                          ? runWithFiberInDEV(
                              lanes,
                              hideTextInstance,
                              previousHoistableRoot
                            )
                          : runWithFiberInDEV(
                              lanes,
                              unhideTextInstance,
                              previousHoistableRoot,
                              lanes.memoizedProps
                            ),
                        trackHostMutation();
                    } catch (error) {
                      captureCommitPhaseError(lanes, lanes.return, error);
                    }
                  }
                } else if (18 === root.tag) {
                  if (null === current) {
                    lanes = root;
                    try {
                      var instance = lanes.stateNode;
                      suspenseCallback
                        ? runWithFiberInDEV(
                            lanes,
                            hideDehydratedBoundary,
                            instance
                          )
                        : runWithFiberInDEV(
                            lanes,
                            unhideDehydratedBoundary,
                            lanes.stateNode
                          );
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
                  if (null === root.return || root.return === finishedWork)
                    break a;
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
          enableViewTransition &&
            (flags & 512 &&
              (offscreenSubtreeWasHidden ||
                null === current ||
                safelyDetachRef(current, current.return)),
            (flags = pushMutationContext()),
            (hoistableRoot = inUpdateViewTransition),
            (previousHoistableRoot =
              enableViewTransition && (lanes & 335544064) === lanes),
            (instance = finishedWork.memoizedProps),
            (inUpdateViewTransition =
              previousHoistableRoot &&
              "none" !==
                getViewTransitionClassName(instance.default, instance.update)),
            recursivelyTraverseMutationEffects(root, finishedWork, lanes),
            commitReconciliationEffects(finishedWork),
            previousHoistableRoot &&
              null !== current &&
              viewTransitionMutationContext &&
              (finishedWork.flags |= 4),
            (inUpdateViewTransition = hoistableRoot),
            popMutationContext(flags));
          break;
        case 21:
          recursivelyTraverseMutationEffects(root, finishedWork, lanes);
          commitReconciliationEffects(finishedWork);
          flags & 512 &&
            (offscreenSubtreeWasHidden ||
              null === current ||
              safelyDetachRef(finishedWork, finishedWork.return),
            offscreenSubtreeIsHidden ||
              safelyAttachRef(finishedWork, finishedWork.return));
          flags & 4 && prepareScopeUpdate(finishedWork.stateNode, finishedWork);
          break;
        case 7:
          enableFragmentRefs &&
            current &&
            null !== current.stateNode &&
            updateFragmentInstanceFiber(finishedWork, current.stateNode);
        default:
          recursivelyTraverseMutationEffects(root, finishedWork, lanes),
            commitReconciliationEffects(finishedWork);
      }
      enableComponentPerformanceTrack &&
        (finishedWork.mode & 2) !== NoMode &&
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
          (isHydratingParent(
            finishedWork.return.alternate,
            finishedWork.return
          ) ||
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
          runWithFiberInDEV(finishedWork, commitPlacement, finishedWork);
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
          5 === fiber.tag &&
            fiber.flags & 1024 &&
            resetFormInstance(fiber.stateNode);
          parentFiber = parentFiber.sibling;
        }
    }
    function recursivelyTraverseAfterMutationEffects(root, parentFiber) {
      if (parentFiber.subtreeFlags & 9270)
        for (parentFiber = parentFiber.child; null !== parentFiber; )
          commitAfterMutationEffectsOnFiber(parentFiber, root),
            (parentFiber = parentFiber.sibling);
      else measureNestedViewTransitions(parentFiber, !1);
    }
    function commitAfterMutationEffectsOnFiber(finishedWork, root) {
      var current = finishedWork.alternate;
      if (null === current) commitEnterViewTransitions(finishedWork, !1);
      else
        switch (finishedWork.tag) {
          case 3:
            rootViewTransitionNameCanceled = viewTransitionContextChanged = !1;
            pushViewTransitionCancelableScope();
            recursivelyTraverseAfterMutationEffects(root, finishedWork);
            if (!viewTransitionContextChanged && !rootViewTransitionAffected) {
              finishedWork = viewTransitionCancelableChildren;
              if (null !== finishedWork)
                for (var i = 0; i < finishedWork.length; i += 3)
                  cancelViewTransitionName(
                    finishedWork[i],
                    finishedWork[i + 1],
                    finishedWork[i + 2]
                  );
              cancelRootViewTransitionName(root.containerInfo);
              rootViewTransitionNameCanceled = !0;
            }
            viewTransitionCancelableChildren = null;
            break;
          case 5:
            recursivelyTraverseAfterMutationEffects(root, finishedWork);
            break;
          case 4:
            i = viewTransitionContextChanged;
            viewTransitionContextChanged = !1;
            recursivelyTraverseAfterMutationEffects(root, finishedWork);
            viewTransitionContextChanged && (rootViewTransitionAffected = !0);
            viewTransitionContextChanged = i;
            break;
          case 22:
            null === finishedWork.memoizedState &&
              (null !== current.memoizedState
                ? commitEnterViewTransitions(finishedWork, !1)
                : recursivelyTraverseAfterMutationEffects(root, finishedWork));
            break;
          case 30:
            i = viewTransitionContextChanged;
            var prevCancelableChildren = pushViewTransitionCancelableScope();
            viewTransitionContextChanged = !1;
            recursivelyTraverseAfterMutationEffects(root, finishedWork);
            viewTransitionContextChanged && (finishedWork.flags |= 4);
            var props = finishedWork.memoizedProps,
              state = finishedWork.stateNode;
            root = getViewTransitionName(props, state);
            state = getViewTransitionName(current.memoizedProps, state);
            var className = getViewTransitionClassName(
              props.default,
              props.update
            );
            "none" === className
              ? (current = !1)
              : ((props = current.memoizedState),
                (current.memoizedState = null),
                (current = finishedWork.child),
                (viewTransitionHostInstanceIdx = 0),
                (current = measureViewTransitionHostInstancesRecursive(
                  finishedWork,
                  current,
                  root,
                  state,
                  className,
                  props,
                  !0
                )),
                viewTransitionHostInstanceIdx !==
                  (null === props ? 0 : props.length) &&
                  (finishedWork.flags |= 32));
            0 !== (finishedWork.flags & 4) && current
              ? (scheduleViewTransitionEvent(
                  finishedWork,
                  finishedWork.memoizedProps.onUpdate
                ),
                (viewTransitionCancelableChildren = prevCancelableChildren))
              : null !== prevCancelableChildren &&
                (prevCancelableChildren.push.apply(
                  prevCancelableChildren,
                  viewTransitionCancelableChildren
                ),
                (viewTransitionCancelableChildren = prevCancelableChildren));
            viewTransitionContextChanged =
              0 !== (finishedWork.flags & 32) ? !0 : i;
            break;
          default:
            recursivelyTraverseAfterMutationEffects(root, finishedWork);
        }
    }
    function recursivelyTraverseLayoutEffects(root, parentFiber) {
      if (parentFiber.subtreeFlags & 8772)
        for (parentFiber = parentFiber.child; null !== parentFiber; )
          commitLayoutEffectOnFiber(root, parentFiber.alternate, parentFiber),
            (parentFiber = parentFiber.sibling);
    }
    function disappearLayoutEffects(finishedWork) {
      var prevEffectStart = pushComponentEffectStart(),
        prevEffectDuration = pushComponentEffectDuration(),
        prevEffectErrors = pushComponentEffectErrors(),
        prevEffectDidSpawnUpdate = pushComponentEffectDidSpawnUpdate();
      switch (finishedWork.tag) {
        case 0:
        case 11:
        case 14:
        case 15:
          commitHookLayoutUnmountEffects(
            finishedWork,
            finishedWork.return,
            Layout
          );
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
          supportsSingletons &&
            runWithFiberInDEV(
              finishedWork,
              releaseSingletonInstance,
              finishedWork.stateNode
            );
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
          enableViewTransition &&
            (finishedWork.flags & 18874368 &&
              untrackNamedViewTransition(finishedWork),
            safelyDetachRef(finishedWork, finishedWork.return));
          recursivelyTraverseDisappearLayoutEffects(finishedWork);
          break;
        case 7:
          enableFragmentRefs &&
            safelyDetachRef(finishedWork, finishedWork.return);
        default:
          recursivelyTraverseDisappearLayoutEffects(finishedWork);
      }
      enableComponentPerformanceTrack &&
        (finishedWork.mode & 2) !== NoMode &&
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
    function recursivelyTraverseDisappearLayoutEffects(parentFiber) {
      for (parentFiber = parentFiber.child; null !== parentFiber; )
        disappearLayoutEffects(parentFiber),
          (parentFiber = parentFiber.sibling);
    }
    function reappearLayoutEffects(
      finishedRoot,
      current,
      finishedWork,
      includeWorkInProgressEffects
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
          recursivelyTraverseReappearLayoutEffects(
            finishedRoot,
            finishedWork,
            includeWorkInProgressEffects
          );
          commitHookLayoutEffects(finishedWork, Layout);
          break;
        case 1:
          recursivelyTraverseReappearLayoutEffects(
            finishedRoot,
            finishedWork,
            includeWorkInProgressEffects
          );
          current = finishedWork.stateNode;
          "function" === typeof current.componentDidMount &&
            runWithFiberInDEV(
              finishedWork,
              callComponentDidMountInDEV,
              finishedWork,
              current
            );
          current = finishedWork.updateQueue;
          if (null !== current) {
            finishedRoot = finishedWork.stateNode;
            try {
              runWithFiberInDEV(
                finishedWork,
                commitHiddenCallbacks,
                current,
                finishedRoot
              );
            } catch (error) {
              captureCommitPhaseError(finishedWork, finishedWork.return, error);
            }
          }
          includeWorkInProgressEffects &&
            flags & 64 &&
            commitClassCallbacks(finishedWork);
          safelyAttachRef(finishedWork, finishedWork.return);
          break;
        case 27:
          supportsSingletons && commitHostSingletonAcquisition(finishedWork);
        case 26:
        case 5:
          if (enableFragmentRefs && 5 === finishedWork.tag)
            a: for (var parent = finishedWork.return; null !== parent; ) {
              isFragmentInstanceParent(parent) &&
                commitNewChildToFragmentInstance(
                  finishedWork.stateNode,
                  parent.stateNode
                );
              if (isHostParent(parent)) break a;
              parent = parent.return;
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
          if (includeWorkInProgressEffects && flags & 4) {
            flags = pushNestedEffectDurations();
            recursivelyTraverseReappearLayoutEffects(
              finishedRoot,
              finishedWork,
              includeWorkInProgressEffects
            );
            includeWorkInProgressEffects = finishedWork.stateNode;
            includeWorkInProgressEffects.effectDuration +=
              bubbleNestedEffectDurations(flags);
            try {
              runWithFiberInDEV(
                finishedWork,
                commitProfiler,
                finishedWork,
                current,
                commitStartTime,
                includeWorkInProgressEffects.effectDuration
              );
            } catch (error) {
              captureCommitPhaseError(finishedWork, finishedWork.return, error);
            }
          } else
            recursivelyTraverseReappearLayoutEffects(
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
          enableViewTransition &&
            (recursivelyTraverseReappearLayoutEffects(
              finishedRoot,
              finishedWork,
              includeWorkInProgressEffects
            ),
            flags & 18874368 && trackNamedViewTransition(finishedWork),
            safelyAttachRef(finishedWork, finishedWork.return));
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
        (finishedWork.mode & 2) !== NoMode &&
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
    function recursivelyTraverseReappearLayoutEffects(
      finishedRoot,
      parentFiber,
      includeWorkInProgressEffects
    ) {
      includeWorkInProgressEffects =
        includeWorkInProgressEffects && 0 !== (parentFiber.subtreeFlags & 8772);
      for (parentFiber = parentFiber.child; null !== parentFiber; )
        reappearLayoutEffects(
          finishedRoot,
          parentFiber.alternate,
          parentFiber,
          includeWorkInProgressEffects
        ),
          (parentFiber = parentFiber.sibling);
    }
    function commitOffscreenPassiveMountEffects(
      current,
      finishedWork,
      instance
    ) {
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
        (null != current && retainCache(current),
        null != previousCache && releaseCache(previousCache));
      if (enableTransitionTracing) {
        current = finishedWork.updateQueue;
        previousCache = null !== finishedWork.memoizedState;
        if (null !== current) {
          if (previousCache) {
            var transitions = current.transitions;
            null !== transitions &&
              transitions.forEach(function (transition) {
                null === instance._transitions &&
                  (instance._transitions = new Set());
                instance._transitions.add(transition);
              });
            current = current.markerInstances;
            null !== current &&
              current.forEach(function (markerInstance) {
                var markerTransitions = markerInstance.transitions;
                null !== markerTransitions &&
                  markerTransitions.forEach(function (transition) {
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
        (retainCache(finishedWork), null != current && releaseCache(current));
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
    function commitPassiveMountEffects(
      root,
      finishedWork,
      committedLanes,
      committedTransitions,
      renderEndTime
    ) {
      resetComponentEffectTimers();
      commitPassiveMountOnFiber(
        root,
        finishedWork,
        committedLanes,
        committedTransitions,
        enableComponentPerformanceTrack ? renderEndTime : 0
      );
    }
    function recursivelyTraversePassiveMountEffects(
      root,
      parentFiber,
      committedLanes,
      committedTransitions,
      endTime
    ) {
      var isViewTransitionEligible =
        enableViewTransition && (committedLanes & 335544064) === committedLanes;
      if (
        parentFiber.subtreeFlags & (isViewTransitionEligible ? 10262 : 10256) ||
        (enableComponentPerformanceTrack &&
          0 !== parentFiber.actualDuration &&
          (null === parentFiber.alternate ||
            parentFiber.alternate.child !== parentFiber.child))
      )
        for (parentFiber = parentFiber.child; null !== parentFiber; )
          enableComponentPerformanceTrack
            ? ((isViewTransitionEligible = parentFiber.sibling),
              commitPassiveMountOnFiber(
                root,
                parentFiber,
                committedLanes,
                committedTransitions,
                null !== isViewTransitionEligible
                  ? isViewTransitionEligible.actualStartTime
                  : endTime
              ),
              (parentFiber = isViewTransitionEligible))
            : (commitPassiveMountOnFiber(
                root,
                parentFiber,
                committedLanes,
                committedTransitions,
                0
              ),
              (parentFiber = parentFiber.sibling));
      else
        isViewTransitionEligible && restoreNestedViewTransitions(parentFiber);
    }
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
        prevDeepEquality = alreadyWarnedForDeepEquality,
        isViewTransitionEligible = enableViewTransition
          ? (committedLanes & 335544064) === committedLanes
          : !1;
      isViewTransitionEligible &&
        null === finishedWork.alternate &&
        null !== finishedWork.return &&
        null !== finishedWork.return.alternate &&
        restoreEnterOrExitViewTransitions(finishedWork);
      var flags = finishedWork.flags;
      switch (finishedWork.tag) {
        case 0:
        case 11:
        case 15:
          enableComponentPerformanceTrack &&
            (finishedWork.mode & 2) !== NoMode &&
            0 < finishedWork.actualStartTime &&
            0 !== (finishedWork.flags & 1) &&
            logComponentRender(
              finishedWork,
              finishedWork.actualStartTime,
              endTime,
              inHydratedSubtree,
              committedLanes
            );
          recursivelyTraversePassiveMountEffects(
            finishedRoot,
            finishedWork,
            committedLanes,
            committedTransitions,
            endTime
          );
          flags & 2048 &&
            commitHookPassiveMountEffects(finishedWork, Passive | HasEffect);
          break;
        case 1:
          enableComponentPerformanceTrack &&
            (finishedWork.mode & 2) !== NoMode &&
            0 < finishedWork.actualStartTime &&
            (0 !== (finishedWork.flags & 128)
              ? logComponentErrored(
                  finishedWork,
                  finishedWork.actualStartTime,
                  endTime,
                  []
                )
              : 0 !== (finishedWork.flags & 1) &&
                logComponentRender(
                  finishedWork,
                  finishedWork.actualStartTime,
                  endTime,
                  inHydratedSubtree,
                  committedLanes
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
          isViewTransitionEligible &&
            supportsMutation &&
            rootViewTransitionNameCanceled &&
            restoreRootViewTransitionName(finishedRoot.containerInfo);
          if (
            flags & 2048 &&
            ((flags = null),
            null !== finishedWork.alternate &&
              (flags = finishedWork.alternate.memoizedState.cache),
            (isViewTransitionEligible = finishedWork.memoizedState.cache),
            isViewTransitionEligible !== flags &&
              (retainCache(isViewTransitionEligible),
              null != flags && releaseCache(flags)),
            enableTransitionTracing)
          ) {
            var incompleteTransitions =
              finishedWork.stateNode.incompleteTransitions;
            null !== committedTransitions &&
              (committedTransitions.forEach(function (transition) {
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
            incompleteTransitions.forEach(
              function (markerInstance, transition) {
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
                    null ===
                      currentPendingTransitionCallbacks.transitionComplete &&
                      (currentPendingTransitionCallbacks.transitionComplete =
                        []),
                    currentPendingTransitionCallbacks.transitionComplete.push(
                      transition
                    )),
                    incompleteTransitions.delete(transition);
              }
            );
            clearTransitionsForLanes(finishedRoot, committedLanes);
          }
          finishedRoot.passiveEffectDuration += popNestedEffectDurations(
            prevProfilerEffectDuration
          );
          break;
        case 12:
          flags & 2048
            ? ((flags = pushNestedEffectDurations()),
              recursivelyTraversePassiveMountEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions,
                endTime
              ),
              (finishedRoot = finishedWork.stateNode),
              (finishedRoot.passiveEffectDuration +=
                bubbleNestedEffectDurations(flags)),
              commitProfilerPostCommit(
                finishedWork,
                finishedWork.alternate,
                commitStartTime,
                finishedRoot.passiveEffectDuration
              ))
            : recursivelyTraversePassiveMountEffects(
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
            ((isViewTransitionEligible =
              null !== finishedWork.alternate
                ? finishedWork.alternate.memoizedState
                : null),
            (prevProfilerEffectDuration = finishedWork.memoizedState),
            null !== isViewTransitionEligible &&
            null === prevProfilerEffectDuration
              ? ((prevProfilerEffectDuration = finishedWork.deletions),
                null !== prevProfilerEffectDuration &&
                0 < prevProfilerEffectDuration.length &&
                18 === prevProfilerEffectDuration[0].tag
                  ? ((inHydratedSubtree = !1),
                    (isViewTransitionEligible =
                      isViewTransitionEligible.hydrationErrors),
                    null !== isViewTransitionEligible &&
                      logComponentErrored(
                        finishedWork,
                        finishedWork.actualStartTime,
                        endTime,
                        isViewTransitionEligible
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
            ((isViewTransitionEligible =
              null !== finishedWork.alternate
                ? finishedWork.alternate.memoizedState
                : null),
            (prevProfilerEffectDuration = finishedWork.memoizedState),
            null === isViewTransitionEligible ||
            null === isViewTransitionEligible.dehydrated ||
            (null !== prevProfilerEffectDuration &&
              null !== prevProfilerEffectDuration.dehydrated)
              ? (inHydratedSubtree = !1)
              : ((prevProfilerEffectDuration = finishedWork.deletions),
                null !== prevProfilerEffectDuration &&
                0 < prevProfilerEffectDuration.length &&
                18 === prevProfilerEffectDuration[0].tag
                  ? ((inHydratedSubtree = !1),
                    (isViewTransitionEligible =
                      isViewTransitionEligible.hydrationErrors),
                    null !== isViewTransitionEligible &&
                      logComponentErrored(
                        finishedWork,
                        finishedWork.actualStartTime,
                        endTime,
                        isViewTransitionEligible
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
          recursivelyTraversePassiveMountEffects(
            finishedRoot,
            finishedWork,
            committedLanes,
            committedTransitions,
            endTime
          );
          flags & 2048 &&
            commitOffscreenPassiveMountEffects(
              finishedWork.alternate,
              finishedWork,
              finishedWork.stateNode
            );
          break;
        case 22:
          prevProfilerEffectDuration = finishedWork.stateNode;
          wasInHydratedSubtree = finishedWork.alternate;
          null !== finishedWork.memoizedState
            ? (isViewTransitionEligible &&
                null !== wasInHydratedSubtree &&
                null === wasInHydratedSubtree.memoizedState &&
                restoreEnterOrExitViewTransitions(wasInHydratedSubtree),
              prevProfilerEffectDuration._visibility &
              OffscreenPassiveEffectsConnected
                ? recursivelyTraversePassiveMountEffects(
                    finishedRoot,
                    finishedWork,
                    committedLanes,
                    committedTransitions,
                    endTime
                  )
                : recursivelyTraverseAtomicPassiveEffects(
                    finishedRoot,
                    finishedWork,
                    committedLanes,
                    committedTransitions,
                    endTime
                  ))
            : (isViewTransitionEligible &&
                null !== wasInHydratedSubtree &&
                null !== wasInHydratedSubtree.memoizedState &&
                restoreEnterOrExitViewTransitions(finishedWork),
              prevProfilerEffectDuration._visibility &
              OffscreenPassiveEffectsConnected
                ? recursivelyTraversePassiveMountEffects(
                    finishedRoot,
                    finishedWork,
                    committedLanes,
                    committedTransitions,
                    endTime
                  )
                : ((prevProfilerEffectDuration._visibility |=
                    OffscreenPassiveEffectsConnected),
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
                    (finishedWork.mode & 2) !== NoMode &&
                    !inHydratedSubtree &&
                    ((finishedRoot = finishedWork.actualStartTime),
                    0 <= finishedRoot &&
                      0.05 < endTime - finishedRoot &&
                      logComponentReappeared(
                        finishedWork,
                        finishedRoot,
                        endTime
                      ),
                    0 <= componentEffectStartTime &&
                      0 <= componentEffectEndTime &&
                      0.05 <
                        componentEffectEndTime - componentEffectStartTime &&
                      logComponentReappeared(
                        finishedWork,
                        componentEffectStartTime,
                        componentEffectEndTime
                      ))));
          flags & 2048 &&
            commitOffscreenPassiveMountEffects(
              wasInHydratedSubtree,
              finishedWork,
              prevProfilerEffectDuration
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
        case 30:
          if (enableViewTransition) {
            isViewTransitionEligible &&
              ((flags = finishedWork.alternate),
              null !== flags &&
                restoreUpdateViewTransition(flags, finishedWork));
            recursivelyTraversePassiveMountEffects(
              finishedRoot,
              finishedWork,
              committedLanes,
              committedTransitions,
              endTime
            );
            break;
          }
        case 25:
          if (enableTransitionTracing) {
            recursivelyTraversePassiveMountEffects(
              finishedRoot,
              finishedWork,
              committedLanes,
              committedTransitions,
              endTime
            );
            flags & 2048 && commitTracingMarkerPassiveMountEffect(finishedWork);
            break;
          }
        default:
          recursivelyTraversePassiveMountEffects(
            finishedRoot,
            finishedWork,
            committedLanes,
            committedTransitions,
            endTime
          );
      }
      if (
        enableComponentPerformanceTrack &&
        (finishedWork.mode & 2) !== NoMode
      ) {
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
              logComponentTrigger(
                finishedWork,
                committedLanes,
                endTime,
                "Mount"
              );
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
      alreadyWarnedForDeepEquality = prevDeepEquality;
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
        prevEffectDidSpawnUpdate = pushComponentEffectDidSpawnUpdate(),
        prevDeepEquality = alreadyWarnedForDeepEquality;
      enableComponentPerformanceTrack &&
        includeWorkInProgressEffects &&
        (finishedWork.mode & 2) !== NoMode &&
        0 < finishedWork.actualStartTime &&
        0 !== (finishedWork.flags & 1) &&
        logComponentRender(
          finishedWork,
          finishedWork.actualStartTime,
          endTime,
          inHydratedSubtree,
          committedLanes
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
          commitHookPassiveMountEffects(finishedWork, Passive);
          break;
        case 23:
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
            commitOffscreenPassiveMountEffects(
              finishedWork.alternate,
              finishedWork,
              finishedWork.stateNode
            );
          break;
        case 22:
          var _instance2 = finishedWork.stateNode;
          null !== finishedWork.memoizedState
            ? _instance2._visibility & OffscreenPassiveEffectsConnected
              ? recursivelyTraverseReconnectPassiveEffects(
                  finishedRoot,
                  finishedWork,
                  committedLanes,
                  committedTransitions,
                  includeWorkInProgressEffects,
                  endTime
                )
              : recursivelyTraverseAtomicPassiveEffects(
                  finishedRoot,
                  finishedWork,
                  committedLanes,
                  committedTransitions,
                  endTime
                )
            : ((_instance2._visibility |= OffscreenPassiveEffectsConnected),
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
              finishedWork,
              _instance2
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
        case 25:
          if (enableTransitionTracing) {
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
              commitTracingMarkerPassiveMountEffect(finishedWork);
            break;
          }
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
        (finishedWork.mode & 2) !== NoMode &&
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
      alreadyWarnedForDeepEquality = prevDeepEquality;
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
      var prevDeepEquality = alreadyWarnedForDeepEquality;
      enableComponentPerformanceTrack &&
        (finishedWork.mode & 2) !== NoMode &&
        0 < finishedWork.actualStartTime &&
        0 !== (finishedWork.flags & 1) &&
        logComponentRender(
          finishedWork,
          finishedWork.actualStartTime,
          endTime,
          inHydratedSubtree,
          committedLanes
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
              finishedWork,
              finishedWork.stateNode
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
      alreadyWarnedForDeepEquality = prevDeepEquality;
    }
    function commitPassiveUnmountEffects(finishedWork) {
      resetComponentEffectTimers();
      commitPassiveUnmountOnFiber(finishedWork);
    }
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
          if (fiber.flags & suspenseyCommitFlag)
            if (null !== fiber.memoizedState)
              suspendResource(
                suspendedState,
                currentHoistableRoot,
                fiber.memoizedState,
                fiber.memoizedProps
              );
            else {
              var instance = fiber.stateNode,
                type = fiber.type;
              fiber = fiber.memoizedProps;
              ((committedLanes & 335544128) === committedLanes ||
                maySuspendCommitInSyncRender(type, fiber)) &&
                suspendInstance(suspendedState, instance, type, fiber);
            }
          break;
        case 5:
          recursivelyAccumulateSuspenseyCommit(
            fiber,
            committedLanes,
            suspendedState
          );
          fiber.flags & suspenseyCommitFlag &&
            ((instance = fiber.stateNode),
            (type = fiber.type),
            (fiber = fiber.memoizedProps),
            ((committedLanes & 335544128) === committedLanes ||
              maySuspendCommitInSyncRender(type, fiber)) &&
              suspendInstance(suspendedState, instance, type, fiber));
          break;
        case 3:
        case 4:
          supportsResources
            ? ((instance = currentHoistableRoot),
              (currentHoistableRoot = getHoistableRoot(
                fiber.stateNode.containerInfo
              )),
              recursivelyAccumulateSuspenseyCommit(
                fiber,
                committedLanes,
                suspendedState
              ),
              (currentHoistableRoot = instance))
            : recursivelyAccumulateSuspenseyCommit(
                fiber,
                committedLanes,
                suspendedState
              );
          break;
        case 22:
          null === fiber.memoizedState &&
            ((instance = fiber.alternate),
            null !== instance && null !== instance.memoizedState
              ? ((instance = suspenseyCommitFlag),
                (suspenseyCommitFlag = 16777216),
                recursivelyAccumulateSuspenseyCommit(
                  fiber,
                  committedLanes,
                  suspendedState
                ),
                (suspenseyCommitFlag = instance))
              : recursivelyAccumulateSuspenseyCommit(
                  fiber,
                  committedLanes,
                  suspendedState
                ));
          break;
        case 30:
          if (enableViewTransition) {
            0 !== (fiber.flags & suspenseyCommitFlag) &&
              ((instance = fiber.memoizedProps.name),
              null != instance &&
                "auto" !== instance &&
                ((type = fiber.stateNode),
                (type.paired = null),
                null === appearingViewTransitions &&
                  (appearingViewTransitions = new Map()),
                appearingViewTransitions.set(instance, type)));
            recursivelyAccumulateSuspenseyCommit(
              fiber,
              committedLanes,
              suspendedState
            );
            break;
          }
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
              (childToDelete.mode & 2) !== NoMode &&
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
            commitHookPassiveUnmountEffects(
              finishedWork,
              finishedWork.return,
              Passive | HasEffect
            );
          break;
        case 3:
          var prevProfilerEffectDuration = pushNestedEffectDurations();
          recursivelyTraversePassiveUnmountEffects(finishedWork);
          finishedWork.stateNode.passiveEffectDuration +=
            popNestedEffectDurations(prevProfilerEffectDuration);
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
          prevProfilerEffectDuration._visibility &
            OffscreenPassiveEffectsConnected &&
          (null === finishedWork.return || 13 !== finishedWork.return.tag)
            ? ((prevProfilerEffectDuration._visibility &=
                ~OffscreenPassiveEffectsConnected),
              recursivelyTraverseDisconnectPassiveEffects(finishedWork),
              enableComponentPerformanceTrack &&
                (finishedWork.mode & 2) !== NoMode &&
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
        (finishedWork.mode & 2) !== NoMode &&
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
              (childToDelete.mode & 2) !== NoMode &&
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
      for (parentFiber = parentFiber.child; null !== parentFiber; )
        disconnectPassiveEffect(parentFiber),
          (parentFiber = parentFiber.sibling);
    }
    function disconnectPassiveEffect(finishedWork) {
      var prevEffectStart = pushComponentEffectStart(),
        prevEffectDuration = pushComponentEffectDuration(),
        prevEffectErrors = pushComponentEffectErrors(),
        prevEffectDidSpawnUpdate = pushComponentEffectDidSpawnUpdate();
      switch (finishedWork.tag) {
        case 0:
        case 11:
        case 15:
          commitHookPassiveUnmountEffects(
            finishedWork,
            finishedWork.return,
            Passive
          );
          recursivelyTraverseDisconnectPassiveEffects(finishedWork);
          break;
        case 22:
          var instance = finishedWork.stateNode;
          instance._visibility & OffscreenPassiveEffectsConnected &&
            ((instance._visibility &= ~OffscreenPassiveEffectsConnected),
            recursivelyTraverseDisconnectPassiveEffects(finishedWork));
          break;
        default:
          recursivelyTraverseDisconnectPassiveEffects(finishedWork);
      }
      enableComponentPerformanceTrack &&
        (finishedWork.mode & 2) !== NoMode &&
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
    function commitPassiveUnmountEffectsInsideOfDeletedTree_begin(
      deletedSubtreeRoot,
      nearestMountedAncestor$jscomp$0
    ) {
      for (; null !== nextEffect; ) {
        var fiber = nextEffect,
          current = fiber,
          nearestMountedAncestor = nearestMountedAncestor$jscomp$0,
          prevEffectStart = pushComponentEffectStart(),
          prevEffectDuration = pushComponentEffectDuration(),
          prevEffectErrors = pushComponentEffectErrors(),
          prevEffectDidSpawnUpdate = pushComponentEffectDidSpawnUpdate();
        switch (current.tag) {
          case 0:
          case 11:
          case 15:
            commitHookPassiveUnmountEffects(
              current,
              nearestMountedAncestor,
              Passive
            );
            break;
          case 23:
          case 22:
            null !== current.memoizedState &&
              null !== current.memoizedState.cachePool &&
              ((nearestMountedAncestor = current.memoizedState.cachePool.pool),
              null != nearestMountedAncestor &&
                retainCache(nearestMountedAncestor));
            break;
          case 13:
            if (enableTransitionTracing) {
              var offscreenFiber = current.child,
                instance = offscreenFiber.stateNode,
                transitions = instance._transitions;
              if (null !== transitions) {
                var abortReason = {
                  reason: "suspense",
                  name: current.memoizedProps.name || null
                };
                if (
                  null === current.memoizedState ||
                  null === current.memoizedState.dehydrated
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
            releaseCache(current.memoizedState.cache);
            break;
          case 25:
            enableTransitionTracing &&
              ((offscreenFiber = current.stateNode.transitions),
              null !== offscreenFiber &&
                ((instance = {
                  reason: "marker",
                  name: current.memoizedProps.name
                }),
                abortParentMarkerTransitionsForDeletedFiber(
                  current,
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
        enableComponentPerformanceTrack &&
          (current.mode & 2) !== NoMode &&
          0 <= componentEffectStartTime &&
          0 <= componentEffectEndTime &&
          (componentEffectSpawnedUpdate || 0.05 < componentEffectDuration) &&
          logComponentEffect(
            current,
            componentEffectStartTime,
            componentEffectEndTime,
            componentEffectDuration,
            componentEffectErrors
          );
        popComponentEffectStart(prevEffectStart);
        popComponentEffectDuration(prevEffectDuration);
        componentEffectSpawnedUpdate = prevEffectDidSpawnUpdate;
        componentEffectErrors = prevEffectErrors;
        current = fiber.child;
        if (null !== current) (current.return = fiber), (nextEffect = current);
        else
          a: for (fiber = deletedSubtreeRoot; null !== nextEffect; ) {
            current = nextEffect;
            prevEffectStart = current.sibling;
            prevEffectDuration = current.return;
            detachFiberAfterEffects(current);
            if (current === fiber) {
              nextEffect = null;
              break a;
            }
            if (null !== prevEffectStart) {
              prevEffectStart.return = prevEffectDuration;
              nextEffect = prevEffectStart;
              break a;
            }
            nextEffect = prevEffectDuration;
          }
      }
    }
    function findFiberRootForHostRoot(hostRoot) {
      var maybeFiber = getInstanceFromNode(hostRoot);
      if (null != maybeFiber) {
        if ("string" !== typeof maybeFiber.memoizedProps["data-testname"])
          throw Error(
            "Invalid host root specified. Should be either a React container or a node with a testname attribute."
          );
        return maybeFiber;
      }
      hostRoot = findFiberRoot(hostRoot);
      if (null === hostRoot)
        throw Error(
          "Could not find React container within specified host subtree."
        );
      return hostRoot.stateNode.current;
    }
    function matchSelector(fiber$jscomp$0, selector) {
      var tag = fiber$jscomp$0.tag;
      switch (selector.$$typeof) {
        case COMPONENT_TYPE:
          if (fiber$jscomp$0.type === selector.value) return !0;
          break;
        case HAS_PSEUDO_CLASS_TYPE:
          a: {
            selector = selector.value;
            fiber$jscomp$0 = [fiber$jscomp$0, 0];
            for (tag = 0; tag < fiber$jscomp$0.length; ) {
              var fiber = fiber$jscomp$0[tag++],
                tag$jscomp$0 = fiber.tag,
                selectorIndex = fiber$jscomp$0[tag++],
                selector$jscomp$0 = selector[selectorIndex];
              if (
                (5 !== tag$jscomp$0 &&
                  26 !== tag$jscomp$0 &&
                  27 !== tag$jscomp$0) ||
                !isHiddenSubtree(fiber)
              ) {
                for (
                  ;
                  null != selector$jscomp$0 &&
                  matchSelector(fiber, selector$jscomp$0);

                )
                  selectorIndex++,
                    (selector$jscomp$0 = selector[selectorIndex]);
                if (selectorIndex === selector.length) {
                  selector = !0;
                  break a;
                } else
                  for (fiber = fiber.child; null !== fiber; )
                    fiber$jscomp$0.push(fiber, selectorIndex),
                      (fiber = fiber.sibling);
              }
            }
            selector = !1;
          }
          return selector;
        case ROLE_TYPE:
          if (
            (5 === tag || 26 === tag || 27 === tag) &&
            matchAccessibilityRole(fiber$jscomp$0.stateNode, selector.value)
          )
            return !0;
          break;
        case TEXT_TYPE:
          if (5 === tag || 6 === tag || 26 === tag || 27 === tag)
            if (
              ((fiber$jscomp$0 = getTextContent(fiber$jscomp$0)),
              null !== fiber$jscomp$0 &&
                0 <= fiber$jscomp$0.indexOf(selector.value))
            )
              return !0;
          break;
        case TEST_NAME_TYPE:
          if (5 === tag || 26 === tag || 27 === tag)
            if (
              ((fiber$jscomp$0 = fiber$jscomp$0.memoizedProps["data-testname"]),
              "string" === typeof fiber$jscomp$0 &&
                fiber$jscomp$0.toLowerCase() === selector.value.toLowerCase())
            )
              return !0;
          break;
        default:
          throw Error("Invalid selector type specified.");
      }
      return !1;
    }
    function selectorToString(selector) {
      switch (selector.$$typeof) {
        case COMPONENT_TYPE:
          return (
            "<" + (getComponentNameFromType(selector.value) || "Unknown") + ">"
          );
        case HAS_PSEUDO_CLASS_TYPE:
          return ":has(" + (selectorToString(selector) || "") + ")";
        case ROLE_TYPE:
          return '[role="' + selector.value + '"]';
        case TEXT_TYPE:
          return '"' + selector.value + '"';
        case TEST_NAME_TYPE:
          return '[data-testname="' + selector.value + '"]';
        default:
          throw Error("Invalid selector type specified.");
      }
    }
    function findPaths(root, selectors) {
      var matchingFibers = [];
      root = [root, 0];
      for (var index = 0; index < root.length; ) {
        var fiber = root[index++],
          tag = fiber.tag,
          selectorIndex = root[index++],
          selector = selectors[selectorIndex];
        if (
          (5 !== tag && 26 !== tag && 27 !== tag) ||
          !isHiddenSubtree(fiber)
        ) {
          for (; null != selector && matchSelector(fiber, selector); )
            selectorIndex++, (selector = selectors[selectorIndex]);
          if (selectorIndex === selectors.length) matchingFibers.push(fiber);
          else
            for (fiber = fiber.child; null !== fiber; )
              root.push(fiber, selectorIndex), (fiber = fiber.sibling);
        }
      }
      return matchingFibers;
    }
    function findAllNodes(hostRoot, selectors) {
      if (!supportsTestSelectors)
        throw Error("Test selector API is not supported by this renderer.");
      hostRoot = findFiberRootForHostRoot(hostRoot);
      hostRoot = findPaths(hostRoot, selectors);
      selectors = [];
      hostRoot = Array.from(hostRoot);
      for (var index = 0; index < hostRoot.length; ) {
        var node = hostRoot[index++],
          tag = node.tag;
        if (5 === tag || 26 === tag || 27 === tag)
          isHiddenSubtree(node) || selectors.push(node.stateNode);
        else
          for (node = node.child; null !== node; )
            hostRoot.push(node), (node = node.sibling);
      }
      return selectors;
    }
    function onCommitRoot() {
      supportsTestSelectors &&
        commitHooks.forEach(function (commitHook) {
          return commitHook();
        });
    }
    function isConcurrentActEnvironment() {
      var isReactActEnvironmentGlobal =
        "undefined" !== typeof IS_REACT_ACT_ENVIRONMENT
          ? IS_REACT_ACT_ENVIRONMENT
          : void 0;
      isReactActEnvironmentGlobal ||
        null === ReactSharedInternals.actQueue ||
        console.error(
          "The current testing environment is not configured to support act(...)"
        );
      return isReactActEnvironmentGlobal;
    }
    function schedulePostPaintCallback(callback) {
      callbacks.push(callback);
      postPaintCallbackScheduled ||
        ((postPaintCallbackScheduled = !0),
        requestPostPaintCallback(function (endTime) {
          for (var i = 0; i < callbacks.length; i++) callbacks[i](endTime);
          postPaintCallbackScheduled = !1;
          callbacks = [];
        }));
    }
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
    function addMarkerCompleteCallbackToPendingTransition(
      markerName,
      transitions
    ) {
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
    function requestUpdateLane(fiber) {
      if (
        (executionContext & RenderContext) !== NoContext &&
        0 !== workInProgressRootRenderLanes
      )
        return workInProgressRootRenderLanes & -workInProgressRootRenderLanes;
      var transition = ReactSharedInternals.T;
      return null !== transition
        ? (transition._updatedFibers || (transition._updatedFibers = new Set()),
          transition._updatedFibers.add(fiber),
          requestTransitionLane())
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
    function scheduleViewTransitionEvent(fiber, callback) {
      if (enableViewTransition && null != callback) {
        var state = fiber.stateNode,
          instance = state.ref;
        null === instance &&
          (instance = state.ref =
            createViewTransitionInstance(
              getViewTransitionName(fiber.memoizedProps, state)
            ));
        null === pendingViewTransitionEvents &&
          (pendingViewTransitionEvents = []);
        pendingViewTransitionEvents.push(callback.bind(null, instance));
      }
    }
    function scheduleUpdateOnFiber(root, fiber, lane) {
      isRunningInsertionEffect &&
        console.error("useInsertionEffect must not schedule updates.");
      isFlushingPassiveEffects && (didScheduleUpdateDuringPassiveEffects = !0);
      if (
        (root === workInProgressRoot &&
          (workInProgressSuspendedReason === SuspendedOnData ||
            workInProgressSuspendedReason === SuspendedOnAction)) ||
        null !== root.cancelPendingCommit
      )
        prepareFreshStack(root, 0),
          markRootSuspended(
            root,
            workInProgressRootRenderLanes,
            workInProgressDeferredLane,
            !1
          );
      markRootUpdated(root, lane);
      if (
        (executionContext & RenderContext) !== NoContext &&
        root === workInProgressRoot
      ) {
        if (isRendering)
          switch (fiber.tag) {
            case 0:
            case 11:
            case 15:
              root =
                (workInProgress && getComponentNameFromFiber(workInProgress)) ||
                "Unknown";
              didWarnAboutUpdateInRenderForAnotherComponent.has(root) ||
                (didWarnAboutUpdateInRenderForAnotherComponent.add(root),
                (lane = getComponentNameFromFiber(fiber) || "Unknown"),
                console.error(
                  "Cannot update a component (`%s`) while rendering a different component (`%s`). To locate the bad setState() call inside `%s`, follow the stack trace as described in https://react.dev/link/setstate-in-render",
                  lane,
                  root,
                  root
                ));
              break;
            case 1:
              didWarnAboutUpdateInRender ||
                (console.error(
                  "Cannot update during an existing state transition (such as within `render`). Render methods should be a pure function of props and state."
                ),
                (didWarnAboutUpdateInRender = !0));
          }
      } else {
        isDevToolsPresent && addFiberToLanesMap(root, fiber, lane);
        warnIfUpdatesNotWrappedWithActDEV(fiber);
        if (
          enableTransitionTracing &&
          ((fiber = ReactSharedInternals.T),
          null !== fiber &&
            null != fiber.name &&
            (-1 === fiber.startTime && (fiber.startTime = now$1()),
            enableTransitionTracing))
        ) {
          var transitionLanesMap = root.transitionLanes,
            index = 31 - clz32(lane),
            transitions = transitionLanesMap[index];
          null === transitions && (transitions = new Set());
          transitions.add(fiber);
          transitionLanesMap[index] = transitions;
        }
        root === workInProgressRoot &&
          ((executionContext & RenderContext) === NoContext &&
            (workInProgressRootInterleavedUpdatedLanes |= lane),
          workInProgressRootExitStatus === RootSuspendedWithDelay &&
            markRootSuspended(
              root,
              workInProgressRootRenderLanes,
              workInProgressDeferredLane,
              !1
            ));
        ensureRootIsScheduled(root);
      }
    }
    function performWorkOnRoot(root, lanes, forceSync) {
      if ((executionContext & (RenderContext | CommitContext)) !== NoContext)
        throw Error("Should not already be working.");
      if (
        enableComponentPerformanceTrack &&
        0 !== workInProgressRootRenderLanes &&
        null !== workInProgress
      ) {
        var yieldedFiber = workInProgress,
          yieldEndTime = now$1();
        switch (yieldReason) {
          case SuspendedOnImmediate:
          case SuspendedOnData:
            var startTime = yieldStartTime;
            supportsUserTiming &&
              ((yieldedFiber = yieldedFiber._debugTask)
                ? yieldedFiber.run(
                    console.timeStamp.bind(
                      console,
                      "Suspended",
                      startTime,
                      yieldEndTime,
                      "Components \u269b",
                      void 0,
                      "primary-light"
                    )
                  )
                : console.timeStamp(
                    "Suspended",
                    startTime,
                    yieldEndTime,
                    "Components \u269b",
                    void 0,
                    "primary-light"
                  ));
            break;
          case SuspendedOnAction:
            startTime = yieldStartTime;
            supportsUserTiming &&
              ((yieldedFiber = yieldedFiber._debugTask)
                ? yieldedFiber.run(
                    console.timeStamp.bind(
                      console,
                      "Action",
                      startTime,
                      yieldEndTime,
                      "Components \u269b",
                      void 0,
                      "primary-light"
                    )
                  )
                : console.timeStamp(
                    "Action",
                    startTime,
                    yieldEndTime,
                    "Components \u269b",
                    void 0,
                    "primary-light"
                  ));
            break;
          default:
            supportsUserTiming &&
              ((yieldedFiber = yieldEndTime - yieldStartTime),
              3 > yieldedFiber ||
                console.timeStamp(
                  "Blocked",
                  yieldStartTime,
                  yieldEndTime,
                  "Components \u269b",
                  void 0,
                  5 > yieldedFiber
                    ? "primary-light"
                    : 10 > yieldedFiber
                      ? "primary"
                      : 100 > yieldedFiber
                        ? "primary-dark"
                        : "error"
                ));
        }
      }
      startTime = (yieldEndTime =
        (!forceSync &&
          0 === (lanes & 127) &&
          0 === (lanes & root.expiredLanes)) ||
        checkIfRootIsPrerendering(root, lanes))
        ? renderRootConcurrent(root, lanes)
        : renderRootSync(root, lanes, !0);
      var renderWasConcurrent = yieldEndTime;
      do {
        if (startTime === RootInProgress) {
          workInProgressRootIsPrerendering &&
            !yieldEndTime &&
            markRootSuspended(root, lanes, 0, !1);
          enableComponentPerformanceTrack &&
            ((lanes = workInProgressSuspendedReason),
            enableComponentPerformanceTrack &&
              ((yieldStartTime = now()), (yieldReason = lanes)));
          break;
        } else {
          forceSync = 0;
          enableComponentPerformanceTrack && (forceSync = now$1());
          yieldedFiber = root.current.alternate;
          if (
            renderWasConcurrent &&
            !isRenderConsistentWithExternalStores(yieldedFiber)
          ) {
            enableComponentPerformanceTrack &&
              (setCurrentTrackFromLanes(lanes),
              (yieldedFiber = renderStartTime),
              (startTime = forceSync),
              !supportsUserTiming ||
                startTime <= yieldedFiber ||
                (workInProgressUpdateTask
                  ? workInProgressUpdateTask.run(
                      console.timeStamp.bind(
                        console,
                        "Teared Render",
                        yieldedFiber,
                        startTime,
                        currentTrack,
                        "Scheduler \u269b",
                        "error"
                      )
                    )
                  : console.timeStamp(
                      "Teared Render",
                      yieldedFiber,
                      startTime,
                      currentTrack,
                      "Scheduler \u269b",
                      "error"
                    )),
              finalizeRender(lanes, forceSync));
            startTime = renderRootSync(root, lanes, !1);
            renderWasConcurrent = !1;
            continue;
          }
          if (startTime === RootErrored) {
            renderWasConcurrent = lanes;
            if (root.errorRecoveryDisabledLanes & renderWasConcurrent)
              var errorRetryLanes = 0;
            else
              (errorRetryLanes = root.pendingLanes & -536870913),
                (errorRetryLanes =
                  0 !== errorRetryLanes
                    ? errorRetryLanes
                    : errorRetryLanes & 536870912
                      ? 536870912
                      : 0);
            if (0 !== errorRetryLanes) {
              enableComponentPerformanceTrack &&
                (setCurrentTrackFromLanes(lanes),
                logErroredRenderPhase(
                  renderStartTime,
                  forceSync,
                  lanes,
                  workInProgressUpdateTask
                ),
                finalizeRender(lanes, forceSync));
              lanes = errorRetryLanes;
              a: {
                startTime = root;
                var errorRetryLanes$jscomp$0 = errorRetryLanes;
                errorRetryLanes = workInProgressRootConcurrentErrors;
                var wasRootDehydrated =
                  supportsHydration &&
                  startTime.current.memoizedState.isDehydrated;
                wasRootDehydrated &&
                  (prepareFreshStack(
                    startTime,
                    errorRetryLanes$jscomp$0
                  ).flags |= 256);
                errorRetryLanes$jscomp$0 = renderRootSync(
                  startTime,
                  errorRetryLanes$jscomp$0,
                  !1
                );
                if (errorRetryLanes$jscomp$0 !== RootErrored) {
                  if (
                    workInProgressRootDidAttachPingListener &&
                    !wasRootDehydrated
                  ) {
                    startTime.errorRecoveryDisabledLanes |= renderWasConcurrent;
                    workInProgressRootInterleavedUpdatedLanes |=
                      renderWasConcurrent;
                    startTime = RootSuspendedWithDelay;
                    break a;
                  }
                  startTime = workInProgressRootRecoverableErrors;
                  workInProgressRootRecoverableErrors = errorRetryLanes;
                  null !== startTime &&
                    (null === workInProgressRootRecoverableErrors
                      ? (workInProgressRootRecoverableErrors = startTime)
                      : workInProgressRootRecoverableErrors.push.apply(
                          workInProgressRootRecoverableErrors,
                          startTime
                        ));
                }
                startTime = errorRetryLanes$jscomp$0;
              }
              renderWasConcurrent = !1;
              if (startTime !== RootErrored) continue;
              else enableComponentPerformanceTrack && (forceSync = now$1());
            }
          }
          if (startTime === RootFatalErrored) {
            enableComponentPerformanceTrack &&
              (setCurrentTrackFromLanes(lanes),
              logErroredRenderPhase(
                renderStartTime,
                forceSync,
                lanes,
                workInProgressUpdateTask
              ),
              finalizeRender(lanes, forceSync));
            prepareFreshStack(root, 0);
            markRootSuspended(root, lanes, 0, !0);
            break;
          }
          a: {
            yieldEndTime = root;
            switch (startTime) {
              case RootInProgress:
              case RootFatalErrored:
                throw Error("Root did not complete. This is a bug in React.");
              case RootSuspendedWithDelay:
                if ((lanes & 4194048) !== lanes) break;
              case RootSuspendedAtTheShell:
                enableComponentPerformanceTrack &&
                  (setCurrentTrackFromLanes(lanes),
                  logSuspendedRenderPhase(
                    renderStartTime,
                    forceSync,
                    lanes,
                    workInProgressUpdateTask
                  ),
                  finalizeRender(lanes, forceSync),
                  (yieldedFiber = lanes),
                  enableComponentPerformanceTrack &&
                    (0 !== (yieldedFiber & 127)
                      ? (blockingSuspendedTime = forceSync)
                      : 0 !== (yieldedFiber & 4194048) &&
                        (transitionSuspendedTime = forceSync)));
                markRootSuspended(
                  yieldEndTime,
                  lanes,
                  workInProgressDeferredLane,
                  !workInProgressRootDidSkipSuspendedSiblings
                );
                break a;
              case RootErrored:
                workInProgressRootRecoverableErrors = null;
                break;
              case RootSuspended:
              case RootCompleted:
                break;
              default:
                throw Error("Unknown root exit status.");
            }
            if (null !== ReactSharedInternals.actQueue)
              commitRoot(
                yieldEndTime,
                yieldedFiber,
                lanes,
                workInProgressRootRecoverableErrors,
                workInProgressTransitions,
                workInProgressRootDidIncludeRecursiveRenderUpdate,
                workInProgressDeferredLane,
                workInProgressRootInterleavedUpdatedLanes,
                workInProgressSuspendedRetryLanes,
                startTime,
                null,
                null,
                renderStartTime,
                forceSync
              );
            else {
              if (
                (lanes & 62914560) === lanes &&
                (alwaysThrottleRetries || startTime === RootSuspended) &&
                ((renderWasConcurrent =
                  globalMostRecentFallbackTime +
                  FALLBACK_THROTTLE_MS -
                  now$1()),
                10 < renderWasConcurrent)
              ) {
                markRootSuspended(
                  yieldEndTime,
                  lanes,
                  workInProgressDeferredLane,
                  !workInProgressRootDidSkipSuspendedSiblings
                );
                if (0 !== getNextLanes(yieldEndTime, 0, !0)) break a;
                pendingEffectsLanes = lanes;
                yieldEndTime.timeoutHandle = scheduleTimeout(
                  commitRootWhenReady.bind(
                    null,
                    yieldEndTime,
                    yieldedFiber,
                    workInProgressRootRecoverableErrors,
                    workInProgressTransitions,
                    workInProgressRootDidIncludeRecursiveRenderUpdate,
                    lanes,
                    workInProgressDeferredLane,
                    workInProgressRootInterleavedUpdatedLanes,
                    workInProgressSuspendedRetryLanes,
                    workInProgressRootDidSkipSuspendedSiblings,
                    startTime,
                    "Throttled",
                    renderStartTime,
                    forceSync
                  ),
                  renderWasConcurrent
                );
                break a;
              }
              commitRootWhenReady(
                yieldEndTime,
                yieldedFiber,
                workInProgressRootRecoverableErrors,
                workInProgressTransitions,
                workInProgressRootDidIncludeRecursiveRenderUpdate,
                lanes,
                workInProgressDeferredLane,
                workInProgressRootInterleavedUpdatedLanes,
                workInProgressSuspendedRetryLanes,
                workInProgressRootDidSkipSuspendedSiblings,
                startTime,
                null,
                renderStartTime,
                forceSync
              );
            }
          }
        }
        break;
      } while (1);
      ensureRootIsScheduled(root);
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
      root.timeoutHandle = noTimeout;
      var subtreeFlags = finishedWork.subtreeFlags,
        isViewTransitionEligible =
          enableViewTransition && (lanes & 335544064) === lanes,
        suspendedState = null;
      if (
        isViewTransitionEligible ||
        subtreeFlags & 8192 ||
        16785408 === (subtreeFlags & 16785408)
      )
        if (
          ((suspendedState = startSuspendingCommit()),
          (appearingViewTransitions = null),
          accumulateSuspenseyCommitOnFiber(finishedWork, lanes, suspendedState),
          isViewTransitionEligible &&
            suspendOnActiveViewTransition(suspendedState, root.containerInfo),
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
              getSuspendedCommitReason(suspendedState, root.containerInfo),
              completedRenderStartTime,
              completedRenderEndTime
            )
          );
          markRootSuspended(
            root,
            lanes,
            spawnedLane,
            !didSkipSuspendedSiblings
          );
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
    function markRootUpdated(root, updatedLanes) {
      root.pendingLanes |= updatedLanes;
      root.indicatorLanes |= updatedLanes & 4194048;
      268435456 !== updatedLanes &&
        ((root.suspendedLanes = 0),
        (root.pingedLanes = 0),
        (root.warmLanes = 0));
      enableInfiniteRenderLoopDetection &&
        (executionContext & RenderContext
          ? (workInProgressRootDidIncludeRecursiveRenderUpdate = !0)
          : executionContext & CommitContext &&
            (didIncludeCommitPhaseUpdate = !0),
        throwIfInfiniteUpdateLoopDetected());
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
        var index = 31 - clz32(lanes),
          lane = 1 << index;
        didAttemptEntireTree[index] = -1;
        lanes &= ~lane;
      }
      0 !== spawnedLane &&
        markSpawnedDeferredLane(root, spawnedLane, suspendedLanes);
    }
    function flushSyncWork() {
      return (executionContext & (RenderContext | CommitContext)) === NoContext
        ? (flushSyncWorkAcrossRoots_impl(0, !1), !1)
        : !0;
    }
    function isAlreadyRendering() {
      return (executionContext & (RenderContext | CommitContext)) !== NoContext;
    }
    function resetWorkInProgressStack() {
      if (null !== workInProgress) {
        if (workInProgressSuspendedReason === NotSuspended)
          var interruptedWork = workInProgress.return;
        else
          (interruptedWork = workInProgress),
            resetContextDependencies(),
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
          (transitionClampTime = finalizationTime),
        0 !== (lanes & 62914560) &&
          enableComponentPerformanceTrack &&
          (retryClampTime = finalizationTime),
        0 !== (lanes & 2080374784) &&
          enableComponentPerformanceTrack &&
          (idleClampTime = finalizationTime));
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
        if (
          0 !== workInProgressRootRenderLanes &&
          0 < previousRenderStartTime
        ) {
          setCurrentTrackFromLanes(workInProgressRootRenderLanes);
          if (
            workInProgressRootExitStatus === RootSuspended ||
            workInProgressRootExitStatus === RootSuspendedWithDelay
          )
            logSuspendedRenderPhase(
              previousRenderStartTime,
              renderStartTime,
              lanes,
              workInProgressUpdateTask
            );
          else {
            var endTime = renderStartTime,
              debugTask = workInProgressUpdateTask;
            if (supportsUserTiming && !(endTime <= previousRenderStartTime)) {
              var color =
                  (lanes & 738197653) === lanes
                    ? "tertiary-dark"
                    : "primary-dark",
                label =
                  (lanes & 536870912) === lanes
                    ? "Prewarm"
                    : (lanes & 201326741) === lanes
                      ? "Interrupted Hydration"
                      : "Interrupted Render";
              debugTask
                ? debugTask.run(
                    console.timeStamp.bind(
                      console,
                      label,
                      previousRenderStartTime,
                      endTime,
                      currentTrack,
                      "Scheduler \u269b",
                      color
                    )
                  )
                : console.timeStamp(
                    label,
                    previousRenderStartTime,
                    endTime,
                    currentTrack,
                    "Scheduler \u269b",
                    color
                  );
            }
          }
          finalizeRender(workInProgressRootRenderLanes, renderStartTime);
        }
        previousRenderStartTime = workInProgressUpdateTask;
        workInProgressUpdateTask = null;
        if (0 !== (lanes & 127)) {
          workInProgressUpdateTask = blockingUpdateTask;
          debugTask =
            0 <= blockingUpdateTime && blockingUpdateTime < blockingClampTime
              ? blockingClampTime
              : blockingUpdateTime;
          endTime =
            0 <= blockingEventTime && blockingEventTime < blockingClampTime
              ? blockingClampTime
              : blockingEventTime;
          color =
            0 <= endTime
              ? endTime
              : 0 <= debugTask
                ? debugTask
                : renderStartTime;
          0 <= blockingSuspendedTime
            ? (setCurrentTrackFromLanes(2),
              logSuspendedWithDelayPhase(
                blockingSuspendedTime,
                color,
                lanes,
                previousRenderStartTime
              ))
            : 0 !== (animatingLanes & 127) &&
              (setCurrentTrackFromLanes(2),
              logAnimatingPhase(blockingClampTime, color, animatingTask));
          previousRenderStartTime = debugTask;
          var eventTime = endTime,
            eventType = blockingEventType,
            eventIsRepeat = 0 < blockingEventRepeatTime,
            isSpawnedUpdate = 1 === blockingUpdateType,
            isPingedUpdate = 2 === blockingUpdateType;
          debugTask = renderStartTime;
          endTime = blockingUpdateTask;
          color = blockingUpdateMethodName;
          label = blockingUpdateComponentName;
          if (supportsUserTiming) {
            currentTrack = "Blocking";
            0 < previousRenderStartTime
              ? previousRenderStartTime > debugTask &&
                (previousRenderStartTime = debugTask)
              : (previousRenderStartTime = debugTask);
            0 < eventTime
              ? eventTime > previousRenderStartTime &&
                (eventTime = previousRenderStartTime)
              : (eventTime = previousRenderStartTime);
            if (null !== eventType && previousRenderStartTime > eventTime) {
              var color$jscomp$0 = eventIsRepeat
                ? "secondary-light"
                : "warning";
              endTime
                ? endTime.run(
                    console.timeStamp.bind(
                      console,
                      eventIsRepeat ? "Consecutive" : "Event: " + eventType,
                      eventTime,
                      previousRenderStartTime,
                      currentTrack,
                      "Scheduler \u269b",
                      color$jscomp$0
                    )
                  )
                : console.timeStamp(
                    eventIsRepeat ? "Consecutive" : "Event: " + eventType,
                    eventTime,
                    previousRenderStartTime,
                    currentTrack,
                    "Scheduler \u269b",
                    color$jscomp$0
                  );
            }
            debugTask > previousRenderStartTime &&
              ((eventTime = isSpawnedUpdate
                ? "error"
                : (lanes & 738197653) === lanes
                  ? "tertiary-light"
                  : "primary-light"),
              (isSpawnedUpdate = isPingedUpdate
                ? "Promise Resolved"
                : isSpawnedUpdate
                  ? "Cascading Update"
                  : 5 < debugTask - previousRenderStartTime
                    ? "Update Blocked"
                    : "Update"),
              (isPingedUpdate = []),
              null != label && isPingedUpdate.push(["Component name", label]),
              null != color && isPingedUpdate.push(["Method name", color]),
              (previousRenderStartTime = {
                start: previousRenderStartTime,
                end: debugTask,
                detail: {
                  devtools: {
                    properties: isPingedUpdate,
                    track: currentTrack,
                    trackGroup: "Scheduler \u269b",
                    color: eventTime
                  }
                }
              }),
              endTime
                ? endTime.run(
                    performance.measure.bind(
                      performance,
                      isSpawnedUpdate,
                      previousRenderStartTime
                    )
                  )
                : performance.measure(isSpawnedUpdate, previousRenderStartTime),
              performance.clearMeasures(isSpawnedUpdate));
          }
          blockingUpdateTime = -1.1;
          blockingUpdateType = 0;
          blockingUpdateComponentName = blockingUpdateMethodName = null;
          blockingSuspendedTime = -1.1;
          blockingEventRepeatTime = blockingEventTime;
          blockingEventTime = -1.1;
          blockingClampTime = now();
        }
        0 !== (lanes & 4194048) &&
          ((workInProgressUpdateTask = transitionUpdateTask),
          (debugTask =
            0 <= transitionStartTime &&
            transitionStartTime < transitionClampTime
              ? transitionClampTime
              : transitionStartTime),
          (previousRenderStartTime =
            0 <= transitionUpdateTime &&
            transitionUpdateTime < transitionClampTime
              ? transitionClampTime
              : transitionUpdateTime),
          (endTime =
            0 <= transitionEventTime &&
            transitionEventTime < transitionClampTime
              ? transitionClampTime
              : transitionEventTime),
          (color =
            0 <= endTime
              ? endTime
              : 0 <= previousRenderStartTime
                ? previousRenderStartTime
                : renderStartTime),
          0 <= transitionSuspendedTime
            ? (setCurrentTrackFromLanes(256),
              logSuspendedWithDelayPhase(
                transitionSuspendedTime,
                color,
                lanes,
                workInProgressUpdateTask
              ))
            : 0 !== (animatingLanes & 4194048) &&
              (setCurrentTrackFromLanes(256),
              logAnimatingPhase(transitionClampTime, color, animatingTask)),
          (isPingedUpdate = endTime),
          (eventTime = transitionEventType),
          (eventType = 0 < transitionEventRepeatTime),
          (eventIsRepeat = 2 === transitionUpdateType),
          (color = renderStartTime),
          (endTime = transitionUpdateTask),
          (label = transitionUpdateMethodName),
          (isSpawnedUpdate = transitionUpdateComponentName),
          supportsUserTiming &&
            ((currentTrack = "Transition"),
            0 < previousRenderStartTime
              ? previousRenderStartTime > color &&
                (previousRenderStartTime = color)
              : (previousRenderStartTime = color),
            0 < debugTask
              ? debugTask > previousRenderStartTime &&
                (debugTask = previousRenderStartTime)
              : (debugTask = previousRenderStartTime),
            0 < isPingedUpdate
              ? isPingedUpdate > debugTask && (isPingedUpdate = debugTask)
              : (isPingedUpdate = debugTask),
            debugTask > isPingedUpdate &&
              null !== eventTime &&
              ((color$jscomp$0 = eventType ? "secondary-light" : "warning"),
              endTime
                ? endTime.run(
                    console.timeStamp.bind(
                      console,
                      eventType ? "Consecutive" : "Event: " + eventTime,
                      isPingedUpdate,
                      debugTask,
                      currentTrack,
                      "Scheduler \u269b",
                      color$jscomp$0
                    )
                  )
                : console.timeStamp(
                    eventType ? "Consecutive" : "Event: " + eventTime,
                    isPingedUpdate,
                    debugTask,
                    currentTrack,
                    "Scheduler \u269b",
                    color$jscomp$0
                  )),
            previousRenderStartTime > debugTask &&
              (endTime
                ? endTime.run(
                    console.timeStamp.bind(
                      console,
                      "Action",
                      debugTask,
                      previousRenderStartTime,
                      currentTrack,
                      "Scheduler \u269b",
                      "primary-dark"
                    )
                  )
                : console.timeStamp(
                    "Action",
                    debugTask,
                    previousRenderStartTime,
                    currentTrack,
                    "Scheduler \u269b",
                    "primary-dark"
                  )),
            color > previousRenderStartTime &&
              ((debugTask = eventIsRepeat
                ? "Promise Resolved"
                : 5 < color - previousRenderStartTime
                  ? "Update Blocked"
                  : "Update"),
              (isPingedUpdate = []),
              null != isSpawnedUpdate &&
                isPingedUpdate.push(["Component name", isSpawnedUpdate]),
              null != label && isPingedUpdate.push(["Method name", label]),
              (previousRenderStartTime = {
                start: previousRenderStartTime,
                end: color,
                detail: {
                  devtools: {
                    properties: isPingedUpdate,
                    track: currentTrack,
                    trackGroup: "Scheduler \u269b",
                    color: "primary-light"
                  }
                }
              }),
              endTime
                ? endTime.run(
                    performance.measure.bind(
                      performance,
                      debugTask,
                      previousRenderStartTime
                    )
                  )
                : performance.measure(debugTask, previousRenderStartTime),
              performance.clearMeasures(debugTask))),
          (transitionUpdateTime = transitionStartTime = -1.1),
          (transitionUpdateType = 0),
          (transitionSuspendedTime = -1.1),
          (transitionEventRepeatTime = transitionEventTime),
          (transitionEventTime = -1.1),
          (transitionClampTime = now()));
        0 !== (lanes & 62914560) &&
          0 !== (animatingLanes & 62914560) &&
          (setCurrentTrackFromLanes(4194304),
          logAnimatingPhase(retryClampTime, renderStartTime, animatingTask));
        0 !== (lanes & 2080374784) &&
          0 !== (animatingLanes & 2080374784) &&
          (setCurrentTrackFromLanes(268435456),
          logAnimatingPhase(idleClampTime, renderStartTime, animatingTask));
      }
      previousRenderStartTime = root.timeoutHandle;
      previousRenderStartTime !== noTimeout &&
        ((root.timeoutHandle = noTimeout),
        cancelTimeout(previousRenderStartTime));
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
      workInProgressSuspendedReason = NotSuspended;
      workInProgressThrownValue = null;
      workInProgressRootDidSkipSuspendedSiblings = !1;
      workInProgressRootIsPrerendering = checkIfRootIsPrerendering(root, lanes);
      workInProgressRootDidAttachPingListener = !1;
      workInProgressRootExitStatus = RootInProgress;
      workInProgressSuspendedRetryLanes =
        workInProgressDeferredLane =
        workInProgressRootPingedLanes =
        workInProgressRootInterleavedUpdatedLanes =
        workInProgressRootSkippedLanes =
          0;
      workInProgressRootRecoverableErrors = workInProgressRootConcurrentErrors =
        null;
      workInProgressRootDidIncludeRecursiveRenderUpdate = !1;
      0 !== (lanes & 8) && (lanes |= lanes & 32);
      endTime = root.entangledLanes;
      if (0 !== endTime)
        for (root = root.entanglements, endTime &= lanes; 0 < endTime; )
          (debugTask = 31 - clz32(endTime)),
            (color = 1 << debugTask),
            (lanes |= root[debugTask]),
            (endTime &= ~color);
      entangledRenderLanes = lanes;
      finishQueueingConcurrentUpdates();
      root = getCurrentTime();
      1e3 < root - lastResetTime &&
        ((ReactSharedInternals.recentlyCreatedOwnerStacks = 0),
        (lastResetTime = root));
      ReactStrictModeWarnings.discardPendingWarnings();
      return previousRenderStartTime;
    }
    function handleThrow(root, thrownValue) {
      currentlyRenderingFiber = null;
      ReactSharedInternals.H = ContextOnlyDispatcher;
      ReactSharedInternals.getCurrentStack = null;
      isRendering = !1;
      current = null;
      thrownValue === SuspenseException ||
      thrownValue === SuspenseActionException
        ? ((thrownValue = getSuspendedThenable()),
          (workInProgressSuspendedReason = SuspendedOnImmediate))
        : thrownValue === SuspenseyCommitException
          ? ((thrownValue = getSuspendedThenable()),
            (workInProgressSuspendedReason = SuspendedOnInstance))
          : (workInProgressSuspendedReason =
              thrownValue === SelectiveHydrationException
                ? SuspendedOnHydration
                : null !== thrownValue &&
                    "object" === typeof thrownValue &&
                    "function" === typeof thrownValue.then
                  ? SuspendedOnDeprecatedThrowPromise
                  : SuspendedOnError);
      workInProgressThrownValue = thrownValue;
      var erroredWork = workInProgress;
      if (null === erroredWork)
        (workInProgressRootExitStatus = RootFatalErrored),
          logUncaughtError(
            root,
            createCapturedValueAtFiber(thrownValue, root.current)
          );
      else if (
        (erroredWork.mode & 2 &&
          stopProfilerTimerIfRunningAndRecordDuration(erroredWork),
        enableSchedulingProfiler)
      )
        switch ((markComponentRenderStopped(), workInProgressSuspendedReason)) {
          case SuspendedOnError:
            enableSchedulingProfiler &&
              null !== injectedProfilingHooks &&
              "function" ===
                typeof injectedProfilingHooks.markComponentErrored &&
              injectedProfilingHooks.markComponentErrored(
                erroredWork,
                thrownValue,
                workInProgressRootRenderLanes
              );
            break;
          case SuspendedOnData:
          case SuspendedOnAction:
          case SuspendedOnImmediate:
          case SuspendedOnDeprecatedThrowPromise:
          case SuspendedAndReadyToContinue:
            enableSchedulingProfiler &&
              null !== injectedProfilingHooks &&
              "function" ===
                typeof injectedProfilingHooks.markComponentSuspended &&
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
    function markRenderDerivedCause(fiber) {
      enableComponentPerformanceTrack &&
        null === workInProgressUpdateTask &&
        (workInProgressUpdateTask =
          null == fiber._debugTask ? null : fiber._debugTask);
    }
    function renderDidSuspendDelayIfPossible() {
      workInProgressRootExitStatus = RootSuspendedWithDelay;
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
      executionContext |= RenderContext;
      var prevDispatcher = pushDispatcher(),
        prevAsyncDispatcher = pushAsyncDispatcher();
      if (
        workInProgressRoot !== root ||
        workInProgressRootRenderLanes !== lanes
      ) {
        if (isDevToolsPresent) {
          var memoizedUpdaters = root.memoizedUpdaters;
          0 < memoizedUpdaters.size &&
            (restorePendingUpdaters(root, workInProgressRootRenderLanes),
            memoizedUpdaters.clear());
          movePendingFibersToMemoized(root, lanes);
        }
        workInProgressTransitions = getTransitionsForLanes(root, lanes);
        prepareFreshStack(root, lanes);
      }
      enableSchedulingProfiler && markRenderStarted(lanes);
      lanes = !1;
      memoizedUpdaters = workInProgressRootExitStatus;
      a: do
        try {
          if (
            workInProgressSuspendedReason !== NotSuspended &&
            null !== workInProgress
          ) {
            var unitOfWork = workInProgress,
              thrownValue = workInProgressThrownValue;
            switch (workInProgressSuspendedReason) {
              case SuspendedOnHydration:
                resetWorkInProgressStack();
                memoizedUpdaters = RootSuspendedAtTheShell;
                break a;
              case SuspendedOnImmediate:
              case SuspendedOnData:
              case SuspendedOnAction:
              case SuspendedOnDeprecatedThrowPromise:
                null === suspenseHandlerStackCursor.current && (lanes = !0);
                var reason = workInProgressSuspendedReason;
                workInProgressSuspendedReason = NotSuspended;
                workInProgressThrownValue = null;
                throwAndUnwindWorkLoop(root, unitOfWork, thrownValue, reason);
                if (
                  shouldYieldForPrerendering &&
                  workInProgressRootIsPrerendering
                ) {
                  memoizedUpdaters = RootInProgress;
                  break a;
                }
                break;
              default:
                (reason = workInProgressSuspendedReason),
                  (workInProgressSuspendedReason = NotSuspended),
                  (workInProgressThrownValue = null),
                  throwAndUnwindWorkLoop(root, unitOfWork, thrownValue, reason);
            }
          }
          workLoopSync();
          memoizedUpdaters = workInProgressRootExitStatus;
          break;
        } catch (thrownValue$4) {
          handleThrow(root, thrownValue$4);
        }
      while (1);
      lanes && root.shellSuspendCounter++;
      resetContextDependencies();
      executionContext = prevExecutionContext;
      ReactSharedInternals.H = prevDispatcher;
      ReactSharedInternals.A = prevAsyncDispatcher;
      enableSchedulingProfiler && markRenderStopped();
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
      executionContext |= RenderContext;
      var prevDispatcher = pushDispatcher(),
        prevAsyncDispatcher = pushAsyncDispatcher();
      if (
        workInProgressRoot !== root ||
        workInProgressRootRenderLanes !== lanes
      ) {
        if (isDevToolsPresent) {
          var memoizedUpdaters = root.memoizedUpdaters;
          0 < memoizedUpdaters.size &&
            (restorePendingUpdaters(root, workInProgressRootRenderLanes),
            memoizedUpdaters.clear());
          movePendingFibersToMemoized(root, lanes);
        }
        workInProgressTransitions = getTransitionsForLanes(root, lanes);
        workInProgressRootRenderTargetTime = now$1() + RENDER_TIMEOUT_MS;
        prepareFreshStack(root, lanes);
      } else
        workInProgressRootIsPrerendering = checkIfRootIsPrerendering(
          root,
          lanes
        );
      enableSchedulingProfiler && markRenderStarted(lanes);
      a: do
        try {
          if (
            workInProgressSuspendedReason !== NotSuspended &&
            null !== workInProgress
          )
            b: switch (
              ((lanes = workInProgress),
              (memoizedUpdaters = workInProgressThrownValue),
              workInProgressSuspendedReason)
            ) {
              case SuspendedOnError:
                workInProgressSuspendedReason = NotSuspended;
                workInProgressThrownValue = null;
                throwAndUnwindWorkLoop(
                  root,
                  lanes,
                  memoizedUpdaters,
                  SuspendedOnError
                );
                break;
              case SuspendedOnData:
              case SuspendedOnAction:
                if (isThenableResolved(memoizedUpdaters)) {
                  workInProgressSuspendedReason = NotSuspended;
                  workInProgressThrownValue = null;
                  replaySuspendedUnitOfWork(lanes);
                  break;
                }
                lanes = function () {
                  (workInProgressSuspendedReason !== SuspendedOnData &&
                    workInProgressSuspendedReason !== SuspendedOnAction) ||
                    workInProgressRoot !== root ||
                    (workInProgressSuspendedReason =
                      SuspendedAndReadyToContinue);
                  ensureRootIsScheduled(root);
                };
                memoizedUpdaters.then(lanes, lanes);
                break a;
              case SuspendedOnImmediate:
                workInProgressSuspendedReason = SuspendedAndReadyToContinue;
                break a;
              case SuspendedOnInstance:
                workInProgressSuspendedReason =
                  SuspendedOnInstanceAndReadyToContinue;
                break a;
              case SuspendedAndReadyToContinue:
                isThenableResolved(memoizedUpdaters)
                  ? ((workInProgressSuspendedReason = NotSuspended),
                    (workInProgressThrownValue = null),
                    replaySuspendedUnitOfWork(lanes))
                  : ((workInProgressSuspendedReason = NotSuspended),
                    (workInProgressThrownValue = null),
                    throwAndUnwindWorkLoop(
                      root,
                      lanes,
                      memoizedUpdaters,
                      SuspendedAndReadyToContinue
                    ));
                break;
              case SuspendedOnInstanceAndReadyToContinue:
                var resource = null;
                switch (workInProgress.tag) {
                  case 26:
                    resource = workInProgress.memoizedState;
                  case 5:
                  case 27:
                    var hostFiber = workInProgress,
                      type = hostFiber.type,
                      props = hostFiber.pendingProps;
                    if (
                      resource
                        ? preloadResource(resource)
                        : preloadInstance(hostFiber.stateNode, type, props)
                    ) {
                      workInProgressSuspendedReason = NotSuspended;
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
                    break;
                  default:
                    console.error(
                      "Unexpected type of fiber triggered a suspensey commit. This is a bug in React."
                    );
                }
                workInProgressSuspendedReason = NotSuspended;
                workInProgressThrownValue = null;
                throwAndUnwindWorkLoop(
                  root,
                  lanes,
                  memoizedUpdaters,
                  SuspendedOnInstanceAndReadyToContinue
                );
                break;
              case SuspendedOnDeprecatedThrowPromise:
                workInProgressSuspendedReason = NotSuspended;
                workInProgressThrownValue = null;
                throwAndUnwindWorkLoop(
                  root,
                  lanes,
                  memoizedUpdaters,
                  SuspendedOnDeprecatedThrowPromise
                );
                break;
              case SuspendedOnHydration:
                resetWorkInProgressStack();
                workInProgressRootExitStatus = RootSuspendedAtTheShell;
                break a;
              default:
                throw Error(
                  "Unexpected SuspendedReason. This is a bug in React."
                );
            }
          null !== ReactSharedInternals.actQueue
            ? workLoopSync()
            : workLoopConcurrentByScheduler();
          break;
        } catch (thrownValue$5) {
          handleThrow(root, thrownValue$5);
        }
      while (1);
      resetContextDependencies();
      ReactSharedInternals.H = prevDispatcher;
      ReactSharedInternals.A = prevAsyncDispatcher;
      executionContext = prevExecutionContext;
      if (null !== workInProgress)
        return (
          enableSchedulingProfiler &&
            enableSchedulingProfiler &&
            null !== injectedProfilingHooks &&
            "function" === typeof injectedProfilingHooks.markRenderYielded &&
            injectedProfilingHooks.markRenderYielded(),
          RootInProgress
        );
      enableSchedulingProfiler && markRenderStopped();
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
      (unitOfWork.mode & 2) !== NoMode
        ? (startProfilerTimer(unitOfWork),
          (current = runWithFiberInDEV(
            unitOfWork,
            beginWork,
            current,
            unitOfWork,
            entangledRenderLanes
          )),
          stopProfilerTimerIfRunningAndRecordDuration(unitOfWork))
        : (current = runWithFiberInDEV(
            unitOfWork,
            beginWork,
            current,
            unitOfWork,
            entangledRenderLanes
          ));
      unitOfWork.memoizedProps = unitOfWork.pendingProps;
      null === current
        ? completeUnitOfWork(unitOfWork)
        : (workInProgress = current);
    }
    function replaySuspendedUnitOfWork(unitOfWork) {
      var next = runWithFiberInDEV(unitOfWork, replayBeginWork, unitOfWork);
      unitOfWork.memoizedProps = unitOfWork.pendingProps;
      null === next ? completeUnitOfWork(unitOfWork) : (workInProgress = next);
    }
    function replayBeginWork(unitOfWork) {
      var current = unitOfWork.alternate,
        isProfilingMode = (unitOfWork.mode & 2) !== NoMode;
      isProfilingMode && startProfilerTimer(unitOfWork);
      switch (unitOfWork.tag) {
        case 15:
        case 0:
          current = replayFunctionComponent(
            current,
            unitOfWork,
            unitOfWork.pendingProps,
            unitOfWork.type,
            void 0,
            workInProgressRootRenderLanes
          );
          break;
        case 11:
          current = replayFunctionComponent(
            current,
            unitOfWork,
            unitOfWork.pendingProps,
            unitOfWork.type.render,
            unitOfWork.ref,
            workInProgressRootRenderLanes
          );
          break;
        case 5:
          resetHooksOnUnwind(unitOfWork);
        default:
          unwindInterruptedWork(current, unitOfWork),
            (unitOfWork = workInProgress =
              resetWorkInProgress(unitOfWork, entangledRenderLanes)),
            (current = beginWork(current, unitOfWork, entangledRenderLanes));
      }
      isProfilingMode &&
        stopProfilerTimerIfRunningAndRecordDuration(unitOfWork);
      return current;
    }
    function throwAndUnwindWorkLoop(
      root,
      unitOfWork,
      thrownValue,
      suspendedReason
    ) {
      resetContextDependencies();
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
          workInProgressRootExitStatus = RootFatalErrored;
          logUncaughtError(
            root,
            createCapturedValueAtFiber(thrownValue, root.current)
          );
          workInProgress = null;
          return;
        }
      } catch (error) {
        if (null !== returnFiber) throw ((workInProgress = returnFiber), error);
        workInProgressRootExitStatus = RootFatalErrored;
        logUncaughtError(
          root,
          createCapturedValueAtFiber(thrownValue, root.current)
        );
        workInProgress = null;
        return;
      }
      if (unitOfWork.flags & 32768) {
        if (isHydrating || suspendedReason === SuspendedOnError) root = !0;
        else if (
          workInProgressRootIsPrerendering ||
          0 !== (workInProgressRootRenderLanes & 536870912)
        )
          root = !1;
        else if (
          ((workInProgressRootDidSkipSuspendedSiblings = root = !0),
          suspendedReason === SuspendedOnData ||
            suspendedReason === SuspendedOnAction ||
            suspendedReason === SuspendedOnImmediate ||
            suspendedReason === SuspendedOnDeprecatedThrowPromise)
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
        current = runWithFiberInDEV(
          completedWork,
          completeWork,
          current,
          completedWork,
          entangledRenderLanes
        );
        (completedWork.mode & 2) !== NoMode &&
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
      workInProgressRootExitStatus === RootInProgress &&
        (workInProgressRootExitStatus = RootCompleted);
    }
    function unwindUnitOfWork(unitOfWork, skipSiblings) {
      do {
        var next = unwindWork(unitOfWork.alternate, unitOfWork);
        if (null !== next) {
          next.flags &= 32767;
          workInProgress = next;
          return;
        }
        if ((unitOfWork.mode & 2) !== NoMode) {
          stopProfilerTimerIfRunningAndRecordIncompleteDuration(unitOfWork);
          next = unitOfWork.actualDuration;
          for (var child = unitOfWork.child; null !== child; )
            (next += child.actualDuration), (child = child.sibling);
          unitOfWork.actualDuration = next;
        }
        next = unitOfWork.return;
        null !== next &&
          ((next.flags |= 32768),
          (next.subtreeFlags = 0),
          (next.deletions = null));
        if (
          !skipSiblings &&
          ((unitOfWork = unitOfWork.sibling), null !== unitOfWork)
        ) {
          workInProgress = unitOfWork;
          return;
        }
        workInProgress = unitOfWork = next;
      } while (null !== unitOfWork);
      workInProgressRootExitStatus = RootSuspendedAtTheShell;
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
      while (pendingEffectsStatus !== NO_PENDING_EFFECTS);
      ReactStrictModeWarnings.flushLegacyContextWarning();
      ReactStrictModeWarnings.flushPendingUnsafeLifecycleWarnings();
      if ((executionContext & (RenderContext | CommitContext)) !== NoContext)
        throw Error("Should not already be working.");
      enableComponentPerformanceTrack &&
        (setCurrentTrackFromLanes(lanes),
        exitStatus === RootErrored
          ? logErroredRenderPhase(
              completedRenderStartTime,
              completedRenderEndTime,
              lanes,
              workInProgressUpdateTask
            )
          : null !== recoverableErrors
            ? logRecoveredRenderPhase(
                completedRenderStartTime,
                completedRenderEndTime,
                lanes,
                recoverableErrors,
                null !== finishedWork &&
                  null !== finishedWork.alternate &&
                  finishedWork.alternate.memoizedState.isDehydrated &&
                  0 !== (finishedWork.flags & 256),
                workInProgressUpdateTask
              )
            : logRenderPhase(
                completedRenderStartTime,
                completedRenderEndTime,
                lanes,
                workInProgressUpdateTask
              ));
      enableSchedulingProfiler &&
        enableSchedulingProfiler &&
        null !== injectedProfilingHooks &&
        "function" === typeof injectedProfilingHooks.markCommitStarted &&
        injectedProfilingHooks.markCommitStarted(lanes);
      if (null === finishedWork)
        enableSchedulingProfiler && markCommitStopped();
      else {
        0 === lanes &&
          console.error(
            "finishedLanes should not be empty during a commit. This is a bug in React."
          );
        if (finishedWork === root.current)
          throw Error(
            "Cannot commit the same tree as before. This error is likely caused by a bug in React. Please file an issue."
          );
        exitStatus = finishedWork.lanes | finishedWork.childLanes;
        exitStatus |= concurrentlyUpdatedLanes;
        markRootFinished(
          root,
          lanes,
          exitStatus,
          spawnedLane,
          updatedLanes,
          suspendedRetryLanes
        );
        didIncludeCommitPhaseUpdate = !1;
        root === workInProgressRoot &&
          ((workInProgress = workInProgressRoot = null),
          (workInProgressRootRenderLanes = 0));
        pendingFinishedWork = finishedWork;
        pendingEffectsRoot = root;
        pendingEffectsLanes = lanes;
        pendingEffectsRemainingLanes = exitStatus;
        pendingPassiveTransitions = transitions;
        pendingRecoverableErrors = recoverableErrors;
        pendingDidIncludeRenderPhaseUpdate = didIncludeRenderPhaseUpdate;
        pendingEffectsRenderEndTime = completedRenderEndTime;
        pendingSuspendedCommitReason = suspendedCommitReason;
        pendingDelayedCommitReason = IMMEDIATE_COMMIT;
        pendingSuspendedViewTransitionReason = null;
        enableViewTransition
          ? ((pendingViewTransitionEvents = null),
            (lanes & 335544064) === lanes
              ? ((pendingTransitionTypes = claimQueuedTransitionTypes(root)),
                (recoverableErrors = 10262))
              : ((pendingTransitionTypes = null), (recoverableErrors = 10256)))
          : (recoverableErrors = 10256);
        (enableComponentPerformanceTrack &&
          0 !== finishedWork.actualDuration) ||
        0 !== (finishedWork.subtreeFlags & recoverableErrors) ||
        0 !== (finishedWork.flags & recoverableErrors)
          ? ((root.callbackNode = null),
            (root.callbackPriority = 0),
            scheduleCallback(NormalPriority$1, function () {
              enableComponentPerformanceTrack && trackSchedulerEvent();
              pendingDelayedCommitReason === IMMEDIATE_COMMIT &&
                (pendingDelayedCommitReason = DELAYED_PASSIVE_COMMIT);
              flushPassiveEffects();
              return null;
            }))
          : ((root.callbackNode = null), (root.callbackPriority = 0));
        commitErrors = null;
        commitStartTime = now();
        enableComponentPerformanceTrack &&
          null !== suspendedCommitReason &&
          logSuspendedCommitPhase(
            completedRenderEndTime,
            commitStartTime,
            suspendedCommitReason,
            workInProgressUpdateTask
          );
        shouldStartViewTransition = !1;
        suspendedCommitReason = 0 !== (finishedWork.flags & 13878);
        if (
          0 !== (finishedWork.subtreeFlags & 13878) ||
          suspendedCommitReason
        ) {
          suspendedCommitReason = ReactSharedInternals.T;
          ReactSharedInternals.T = null;
          completedRenderEndTime = getCurrentUpdatePriority();
          setCurrentUpdatePriority(2);
          recoverableErrors = executionContext;
          executionContext |= CommitContext;
          try {
            commitBeforeMutationEffects(root, finishedWork, lanes);
          } finally {
            (executionContext = recoverableErrors),
              setCurrentUpdatePriority(completedRenderEndTime),
              (ReactSharedInternals.T = suspendedCommitReason);
          }
        }
        finishedWork = shouldStartViewTransition;
        pendingEffectsStatus = PENDING_MUTATION_PHASE;
        enableViewTransition && finishedWork
          ? (enableComponentPerformanceTrack &&
              ((animatingLanes |= lanes), (animatingTask = null)),
            (pendingViewTransition = startViewTransition(
              suspendedState,
              root.containerInfo,
              pendingTransitionTypes,
              flushMutationEffects,
              flushLayoutEffects,
              flushAfterMutationEffects,
              flushSpawnedWork,
              flushPassiveEffects,
              reportViewTransitionError,
              suspendedViewTransition,
              finishedViewTransition.bind(null, lanes)
            )))
          : (flushMutationEffects(), flushLayoutEffects(), flushSpawnedWork());
      }
    }
    function reportViewTransitionError(error) {
      if (pendingEffectsStatus !== NO_PENDING_EFFECTS) {
        var onRecoverableError = pendingEffectsRoot.onRecoverableError;
        onRecoverableError(error, makeErrorInfo(null));
      }
    }
    function suspendedViewTransition(reason) {
      enableComponentPerformanceTrack &&
        ((commitEndTime = now()),
        logCommitPhase(
          null === pendingSuspendedCommitReason
            ? pendingEffectsRenderEndTime
            : commitStartTime,
          commitEndTime,
          commitErrors,
          pendingDelayedCommitReason === ABORTED_VIEW_TRANSITION_COMMIT,
          workInProgressUpdateTask
        ),
        (pendingSuspendedCommitReason = pendingSuspendedViewTransitionReason =
          reason));
    }
    function finishedViewTransition(lanes) {
      if (enableComponentPerformanceTrack && 0 !== (animatingLanes & lanes)) {
        var task = animatingTask;
        animatingLanes &= ~lanes;
        animatingTask = null;
        0 !== (lanes & 4194048) &&
          0 === (workInProgressRootRenderLanes & 4194048) &&
          0 === (pendingEffectsLanes & 4194048) &&
          (setCurrentTrackFromLanes(256),
          logAnimatingPhase(transitionClampTime, now$1(), task));
        0 !== (lanes & 62914560) &&
          0 === (workInProgressRootRenderLanes & 62914560) &&
          0 === (pendingEffectsLanes & 62914560) &&
          (setCurrentTrackFromLanes(4194304),
          logAnimatingPhase(retryClampTime, now$1(), task));
        0 !== (lanes & 2080374784) &&
          0 === (workInProgressRootRenderLanes & 2080374784) &&
          0 === (pendingEffectsLanes & 2080374784) &&
          (setCurrentTrackFromLanes(268435456),
          logAnimatingPhase(idleClampTime, now$1(), task));
      }
    }
    function flushAfterMutationEffects() {
      pendingEffectsStatus === PENDING_AFTER_MUTATION_PHASE &&
        ((pendingEffectsStatus = NO_PENDING_EFFECTS),
        enableViewTransition &&
          commitAfterMutationEffectsOnFiber(
            pendingFinishedWork,
            pendingEffectsRoot
          ),
        (pendingEffectsStatus = PENDING_SPAWNED_WORK));
    }
    function flushMutationEffects() {
      if (pendingEffectsStatus === PENDING_MUTATION_PHASE) {
        pendingEffectsStatus = NO_PENDING_EFFECTS;
        var root = pendingEffectsRoot,
          finishedWork = pendingFinishedWork,
          lanes = pendingEffectsLanes,
          rootMutationHasEffect = 0 !== (finishedWork.flags & 13878);
        if (
          0 !== (finishedWork.subtreeFlags & 13878) ||
          rootMutationHasEffect
        ) {
          rootMutationHasEffect = ReactSharedInternals.T;
          ReactSharedInternals.T = null;
          var previousPriority = getCurrentUpdatePriority();
          setCurrentUpdatePriority(2);
          var prevExecutionContext = executionContext;
          executionContext |= CommitContext;
          try {
            (inProgressLanes = lanes),
              (inProgressRoot = root),
              (inUpdateViewTransition = rootViewTransitionAffected = !1),
              resetComponentEffectTimers(),
              commitMutationEffectsOnFiber(finishedWork, root, lanes),
              (inProgressRoot = inProgressLanes = null),
              shouldFireAfterActiveInstanceBlur && afterActiveInstanceBlur(),
              resetAfterCommit(root.containerInfo);
          } finally {
            (executionContext = prevExecutionContext),
              setCurrentUpdatePriority(previousPriority),
              (ReactSharedInternals.T = rootMutationHasEffect);
          }
        }
        root.current = finishedWork;
        pendingEffectsStatus = PENDING_LAYOUT_PHASE;
      }
    }
    function flushLayoutEffects() {
      if (pendingEffectsStatus === PENDING_LAYOUT_PHASE) {
        pendingEffectsStatus = NO_PENDING_EFFECTS;
        if (enableComponentPerformanceTrack) {
          var suspendedViewTransitionReason =
            pendingSuspendedViewTransitionReason;
          if (null !== suspendedViewTransitionReason) {
            commitStartTime = now();
            var startTime = commitEndTime,
              endTime = commitStartTime;
            !supportsUserTiming ||
              endTime <= startTime ||
              (animatingTask
                ? animatingTask.run(
                    console.timeStamp.bind(
                      console,
                      suspendedViewTransitionReason,
                      startTime,
                      endTime,
                      currentTrack,
                      "Scheduler \u269b",
                      "secondary-light"
                    )
                  )
                : console.timeStamp(
                    suspendedViewTransitionReason,
                    startTime,
                    endTime,
                    currentTrack,
                    "Scheduler \u269b",
                    "secondary-light"
                  ));
          }
        }
        suspendedViewTransitionReason = pendingEffectsRoot;
        startTime = pendingFinishedWork;
        endTime = pendingEffectsLanes;
        var cleanUpIndicator = suspendedViewTransitionReason.pendingIndicator;
        if (
          null !== cleanUpIndicator &&
          0 === suspendedViewTransitionReason.indicatorLanes
        ) {
          var prevTransition = ReactSharedInternals.T;
          ReactSharedInternals.T = null;
          var previousPriority = getCurrentUpdatePriority();
          setCurrentUpdatePriority(2);
          var prevExecutionContext = executionContext;
          executionContext |= CommitContext;
          suspendedViewTransitionReason.pendingIndicator = null;
          try {
            cleanUpIndicator();
          } catch (x) {
            reportGlobalError(x);
          } finally {
            (executionContext = prevExecutionContext),
              setCurrentUpdatePriority(previousPriority),
              (ReactSharedInternals.T = prevTransition);
          }
        }
        cleanUpIndicator = 0 !== (startTime.flags & 8772);
        if (0 !== (startTime.subtreeFlags & 8772) || cleanUpIndicator) {
          cleanUpIndicator = ReactSharedInternals.T;
          ReactSharedInternals.T = null;
          prevTransition = getCurrentUpdatePriority();
          setCurrentUpdatePriority(2);
          previousPriority = executionContext;
          executionContext |= CommitContext;
          try {
            enableSchedulingProfiler &&
              enableSchedulingProfiler &&
              null !== injectedProfilingHooks &&
              "function" ===
                typeof injectedProfilingHooks.markLayoutEffectsStarted &&
              injectedProfilingHooks.markLayoutEffectsStarted(endTime),
              (inProgressLanes = endTime),
              (inProgressRoot = suspendedViewTransitionReason),
              resetComponentEffectTimers(),
              commitLayoutEffectOnFiber(
                suspendedViewTransitionReason,
                startTime.alternate,
                startTime
              ),
              (inProgressRoot = inProgressLanes = null),
              enableSchedulingProfiler &&
                enableSchedulingProfiler &&
                null !== injectedProfilingHooks &&
                "function" ===
                  typeof injectedProfilingHooks.markLayoutEffectsStopped &&
                injectedProfilingHooks.markLayoutEffectsStopped();
          } finally {
            (executionContext = previousPriority),
              setCurrentUpdatePriority(prevTransition),
              (ReactSharedInternals.T = cleanUpIndicator);
          }
        }
        suspendedViewTransitionReason = pendingEffectsRenderEndTime;
        startTime = pendingSuspendedCommitReason;
        enableComponentPerformanceTrack &&
          ((commitEndTime = now()),
          logCommitPhase(
            null === startTime
              ? suspendedViewTransitionReason
              : commitStartTime,
            commitEndTime,
            commitErrors,
            pendingDelayedCommitReason === ABORTED_VIEW_TRANSITION_COMMIT,
            workInProgressUpdateTask
          ));
        pendingEffectsStatus = PENDING_AFTER_MUTATION_PHASE;
      }
    }
    function flushSpawnedWork() {
      if (
        pendingEffectsStatus === PENDING_SPAWNED_WORK ||
        pendingEffectsStatus === PENDING_AFTER_MUTATION_PHASE
      ) {
        if (
          enableComponentPerformanceTrack &&
          pendingEffectsStatus === PENDING_SPAWNED_WORK
        ) {
          var startViewTransitionStartTime = commitEndTime;
          commitEndTime = now();
          logStartViewTransitionYieldPhase(
            startViewTransitionStartTime,
            commitEndTime,
            pendingDelayedCommitReason === ABORTED_VIEW_TRANSITION_COMMIT,
            animatingTask
          );
          pendingDelayedCommitReason !== ABORTED_VIEW_TRANSITION_COMMIT &&
            (pendingDelayedCommitReason = ANIMATION_STARTED_COMMIT);
        }
        pendingEffectsStatus = NO_PENDING_EFFECTS;
        pendingViewTransition = null;
        requestPaint();
        startViewTransitionStartTime = pendingEffectsRoot;
        var finishedWork = pendingFinishedWork,
          lanes = pendingEffectsLanes,
          recoverableErrors = pendingRecoverableErrors,
          didIncludeRenderPhaseUpdate = pendingDidIncludeRenderPhaseUpdate,
          passiveSubtreeMask =
            enableViewTransition && (lanes & 335544064) === lanes
              ? 10262
              : 10256;
        (passiveSubtreeMask =
          (enableComponentPerformanceTrack &&
            0 !== finishedWork.actualDuration) ||
          0 !== (finishedWork.subtreeFlags & passiveSubtreeMask) ||
          0 !== (finishedWork.flags & passiveSubtreeMask))
          ? (pendingEffectsStatus = PENDING_PASSIVE_PHASE)
          : ((pendingEffectsStatus = NO_PENDING_EFFECTS),
            (pendingFinishedWork = pendingEffectsRoot = null),
            releaseRootPooledCache(
              startViewTransitionStartTime,
              startViewTransitionStartTime.pendingLanes
            ),
            (nestedPassiveUpdateCount = 0),
            (rootWithPassiveNestedUpdates = null));
        var remainingLanes = startViewTransitionStartTime.pendingLanes;
        0 === remainingLanes && (legacyErrorBoundariesThatAlreadyFailed = null);
        passiveSubtreeMask ||
          commitDoubleInvokeEffectsInDEV(startViewTransitionStartTime);
        remainingLanes = lanesToEventPriority(lanes);
        onCommitRoot$1(finishedWork.stateNode, remainingLanes);
        isDevToolsPresent &&
          startViewTransitionStartTime.memoizedUpdaters.clear();
        onCommitRoot();
        if (null !== recoverableErrors) {
          finishedWork = ReactSharedInternals.T;
          remainingLanes = getCurrentUpdatePriority();
          setCurrentUpdatePriority(2);
          ReactSharedInternals.T = null;
          try {
            for (
              var onRecoverableError =
                  startViewTransitionStartTime.onRecoverableError,
                i = 0;
              i < recoverableErrors.length;
              i++
            ) {
              var recoverableError = recoverableErrors[i],
                errorInfo = makeErrorInfo(recoverableError.stack);
              runWithFiberInDEV(
                recoverableError.source,
                onRecoverableError,
                recoverableError.value,
                errorInfo
              );
            }
          } finally {
            (ReactSharedInternals.T = finishedWork),
              setCurrentUpdatePriority(remainingLanes);
          }
        }
        if (
          enableViewTransition &&
          ((onRecoverableError = pendingViewTransitionEvents),
          (recoverableError = pendingTransitionTypes),
          (pendingTransitionTypes = null),
          null !== onRecoverableError)
        )
          for (
            pendingViewTransitionEvents = null,
              null === recoverableError && (recoverableError = []),
              errorInfo = 0;
            errorInfo < onRecoverableError.length;
            errorInfo++
          )
            (0, onRecoverableError[errorInfo])(recoverableError);
        0 !== (pendingEffectsLanes & 3) && flushPendingEffects();
        ensureRootIsScheduled(startViewTransitionStartTime);
        remainingLanes = startViewTransitionStartTime.pendingLanes;
        (enableInfiniteRenderLoopDetection &&
          (didIncludeRenderPhaseUpdate || didIncludeCommitPhaseUpdate)) ||
        (0 !== (lanes & 261930) && 0 !== (remainingLanes & 42))
          ? ((nestedUpdateScheduled = !0),
            startViewTransitionStartTime === rootWithNestedUpdates
              ? nestedUpdateCount++
              : ((nestedUpdateCount = 0),
                (rootWithNestedUpdates = startViewTransitionStartTime)))
          : (nestedUpdateCount = 0);
        enableComponentPerformanceTrack &&
          (passiveSubtreeMask || finalizeRender(lanes, commitEndTime));
        supportsHydration && flushHydrationEvents();
        flushSyncWorkAcrossRoots_impl(0, !1);
        enableSchedulingProfiler && markCommitStopped();
        if (enableTransitionTracing) {
          var prevRootTransitionCallbacks =
            startViewTransitionStartTime.transitionCallbacks;
          null !== prevRootTransitionCallbacks &&
            schedulePostPaintCallback(function (endTime) {
              var prevPendingTransitionCallbacks =
                currentPendingTransitionCallbacks;
              null !== prevPendingTransitionCallbacks
                ? ((currentPendingTransitionCallbacks = null),
                  scheduleCallback(IdlePriority, function () {
                    processTransitionCallbacks(
                      prevPendingTransitionCallbacks,
                      endTime,
                      prevRootTransitionCallbacks
                    );
                  }))
                : (currentEndTime = endTime);
            });
        }
      }
    }
    function makeErrorInfo(componentStack) {
      componentStack = { componentStack: componentStack };
      Object.defineProperty(componentStack, "digest", {
        get: function () {
          console.error(
            'You are accessing "digest" from the errorInfo object passed to onRecoverableError. This property is no longer provided as part of errorInfo but can be accessed as a property of the Error instance itself.'
          );
        }
      });
      return componentStack;
    }
    function releaseRootPooledCache(root, remainingLanes) {
      0 === (root.pooledCacheLanes &= remainingLanes) &&
        ((remainingLanes = root.pooledCache),
        null != remainingLanes &&
          ((root.pooledCache = null), releaseCache(remainingLanes)));
    }
    function flushPendingEffects() {
      enableViewTransition &&
        null !== pendingViewTransition &&
        (stopViewTransition(pendingViewTransition),
        didWarnAboutInterruptedViewTransitions ||
          ((didWarnAboutInterruptedViewTransitions = !0),
          console.warn(
            "A flushSync update cancelled a View Transition because it was called while the View Transition was still preparing. To preserve the synchronous semantics, React had to skip the View Transition. If you can, try to avoid flushSync() in a scenario that's likely to interfere."
          )),
        (pendingViewTransition = null),
        (pendingDelayedCommitReason = ABORTED_VIEW_TRANSITION_COMMIT));
      flushMutationEffects();
      flushLayoutEffects();
      flushSpawnedWork();
      return flushPassiveEffects();
    }
    function flushPassiveEffects() {
      if (pendingEffectsStatus !== PENDING_PASSIVE_PHASE) return !1;
      var root = pendingEffectsRoot,
        remainingLanes = pendingEffectsRemainingLanes;
      pendingEffectsRemainingLanes = 0;
      var renderPriority = lanesToEventPriority(pendingEffectsLanes);
      renderPriority = 32 > renderPriority ? 32 : renderPriority;
      var prevTransition = ReactSharedInternals.T,
        previousPriority = getCurrentUpdatePriority();
      try {
        return (
          setCurrentUpdatePriority(renderPriority),
          (ReactSharedInternals.T = null),
          flushPassiveEffectsImpl()
        );
      } finally {
        setCurrentUpdatePriority(previousPriority),
          (ReactSharedInternals.T = prevTransition),
          releaseRootPooledCache(root, remainingLanes);
      }
    }
    function flushPassiveEffectsImpl() {
      var transitions = pendingPassiveTransitions;
      pendingPassiveTransitions = null;
      var root = pendingEffectsRoot,
        lanes = pendingEffectsLanes;
      pendingEffectsStatus = NO_PENDING_EFFECTS;
      pendingFinishedWork = pendingEffectsRoot = null;
      pendingEffectsLanes = 0;
      if ((executionContext & (RenderContext | CommitContext)) !== NoContext)
        throw Error("Cannot flush passive effects while already rendering.");
      enableComponentPerformanceTrack && setCurrentTrackFromLanes(lanes);
      isFlushingPassiveEffects = !0;
      didScheduleUpdateDuringPassiveEffects = !1;
      var passiveEffectStartTime = 0;
      enableComponentPerformanceTrack &&
        ((commitErrors = null),
        (passiveEffectStartTime = now$1()),
        pendingDelayedCommitReason === ANIMATION_STARTED_COMMIT
          ? logAnimatingPhase(
              commitEndTime,
              passiveEffectStartTime,
              animatingTask
            )
          : logPaintYieldPhase(
              commitEndTime,
              passiveEffectStartTime,
              pendingDelayedCommitReason === DELAYED_PASSIVE_COMMIT,
              workInProgressUpdateTask
            ));
      enableSchedulingProfiler &&
        enableSchedulingProfiler &&
        null !== injectedProfilingHooks &&
        "function" ===
          typeof injectedProfilingHooks.markPassiveEffectsStarted &&
        injectedProfilingHooks.markPassiveEffectsStarted(lanes);
      var prevExecutionContext = executionContext;
      executionContext |= CommitContext;
      commitPassiveUnmountEffects(root.current);
      commitPassiveMountEffects(
        root,
        root.current,
        lanes,
        transitions,
        pendingEffectsRenderEndTime
      );
      enableSchedulingProfiler &&
        enableSchedulingProfiler &&
        null !== injectedProfilingHooks &&
        "function" ===
          typeof injectedProfilingHooks.markPassiveEffectsStopped &&
        injectedProfilingHooks.markPassiveEffectsStopped();
      commitDoubleInvokeEffectsInDEV(root);
      executionContext = prevExecutionContext;
      enableComponentPerformanceTrack &&
        ((transitions = now$1()),
        logPassiveCommitPhase(
          passiveEffectStartTime,
          transitions,
          commitErrors,
          workInProgressUpdateTask
        ),
        finalizeRender(lanes, transitions));
      flushSyncWorkAcrossRoots_impl(0, !1);
      if (enableTransitionTracing) {
        var prevPendingTransitionCallbacks = currentPendingTransitionCallbacks,
          prevRootTransitionCallbacks = root.transitionCallbacks,
          prevEndTime = currentEndTime;
        null !== prevPendingTransitionCallbacks &&
          null !== prevRootTransitionCallbacks &&
          null !== prevEndTime &&
          ((currentEndTime = currentPendingTransitionCallbacks = null),
          scheduleCallback(IdlePriority, function () {
            processTransitionCallbacks(
              prevPendingTransitionCallbacks,
              prevEndTime,
              prevRootTransitionCallbacks
            );
          }));
      }
      didScheduleUpdateDuringPassiveEffects
        ? root === rootWithPassiveNestedUpdates
          ? nestedPassiveUpdateCount++
          : ((nestedPassiveUpdateCount = 0),
            (rootWithPassiveNestedUpdates = root))
        : (nestedPassiveUpdateCount = 0);
      didScheduleUpdateDuringPassiveEffects = isFlushingPassiveEffects = !1;
      if (
        injectedHook &&
        "function" === typeof injectedHook.onPostCommitFiberRoot
      )
        try {
          injectedHook.onPostCommitFiberRoot(rendererID, root);
        } catch (err) {
          hasLoggedError ||
            ((hasLoggedError = !0),
            console.error(
              "React instrumentation encountered an error: %o",
              err
            ));
        }
      root = root.current.stateNode;
      root.effectDuration = 0;
      root.passiveEffectDuration = 0;
      return !0;
    }
    function captureCommitPhaseErrorOnRoot(rootFiber, sourceFiber, error) {
      sourceFiber = createCapturedValueAtFiber(error, sourceFiber);
      enableComponentPerformanceTrack && recordEffectError(sourceFiber);
      sourceFiber = createRootErrorUpdate(rootFiber.stateNode, sourceFiber, 2);
      rootFiber = enqueueUpdate(rootFiber, sourceFiber, 2);
      null !== rootFiber &&
        (markRootUpdated(rootFiber, 2), ensureRootIsScheduled(rootFiber));
    }
    function captureCommitPhaseError(
      sourceFiber,
      nearestMountedAncestor,
      error
    ) {
      isRunningInsertionEffect = !1;
      if (3 === sourceFiber.tag)
        captureCommitPhaseErrorOnRoot(sourceFiber, sourceFiber, error);
      else {
        for (; null !== nearestMountedAncestor; ) {
          if (3 === nearestMountedAncestor.tag) {
            captureCommitPhaseErrorOnRoot(
              nearestMountedAncestor,
              sourceFiber,
              error
            );
            return;
          }
          if (1 === nearestMountedAncestor.tag) {
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
                markRootUpdated(instance, 2),
                ensureRootIsScheduled(instance));
              return;
            }
          }
          nearestMountedAncestor = nearestMountedAncestor.return;
        }
        console.error(
          "Internal React error: Attempted to capture a commit phase error inside a detached tree. This indicates a bug in React. Potential causes include deleting the same fiber more than once, committing an already-finished tree, or an inconsistent return pointer.\n\nError message:\n\n%s",
          error
        );
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
      enableInfiniteRenderLoopDetection &&
        (executionContext & RenderContext
          ? (workInProgressRootDidIncludeRecursiveRenderUpdate = !0)
          : executionContext & CommitContext &&
            (didIncludeCommitPhaseUpdate = !0),
        throwIfInfiniteUpdateLoopDetected());
      enableComponentPerformanceTrack &&
        enableComponentPerformanceTrack &&
        (0 !== (pingedLanes & 127)
          ? 0 > blockingUpdateTime &&
            ((blockingClampTime = blockingUpdateTime = now()),
            (blockingUpdateTask = createTask("Promise Resolved")),
            (blockingUpdateType = 2))
          : 0 !== (pingedLanes & 4194048) &&
            0 > transitionUpdateTime &&
            ((transitionClampTime = transitionUpdateTime = now()),
            (transitionUpdateTask = createTask("Promise Resolved")),
            (transitionUpdateType = 2)));
      isConcurrentActEnvironment() &&
        null === ReactSharedInternals.actQueue &&
        console.error(
          "A suspended resource finished loading inside a test, but the event was not wrapped in act(...).\n\nWhen testing, code that resolves suspended data should be wrapped into act(...):\n\nact(() => {\n  /* finish loading suspended data */\n});\n/* assert on the output */\n\nThis ensures that you're testing the behavior the user would see in the browser. Learn more at https://react.dev/link/wrap-tests-with-act"
        );
      workInProgressRoot === root &&
        (workInProgressRootRenderLanes & pingedLanes) === pingedLanes &&
        (workInProgressRootExitStatus === RootSuspendedWithDelay ||
        (workInProgressRootExitStatus === RootSuspended &&
          (workInProgressRootRenderLanes & 62914560) ===
            workInProgressRootRenderLanes &&
          now$1() - globalMostRecentFallbackTime < FALLBACK_THROTTLE_MS)
          ? (executionContext & RenderContext) === NoContext &&
            prepareFreshStack(root, 0)
          : (workInProgressRootPingedLanes |= pingedLanes),
        workInProgressSuspendedRetryLanes === workInProgressRootRenderLanes &&
          (workInProgressSuspendedRetryLanes = 0));
      ensureRootIsScheduled(root);
    }
    function retryTimedOutBoundary(boundaryFiber, retryLane) {
      0 === retryLane && (retryLane = claimNextRetryLane());
      boundaryFiber = enqueueConcurrentRenderForLane(boundaryFiber, retryLane);
      null !== boundaryFiber &&
        (markRootUpdated(boundaryFiber, retryLane),
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
          throw Error(
            "Pinged unknown suspense boundary type. This is probably a bug in React."
          );
      }
      null !== retryCache && retryCache.delete(wakeable);
      retryTimedOutBoundary(boundaryFiber, retryLane);
    }
    function throwIfInfiniteUpdateLoopDetected() {
      if (nestedUpdateCount > NESTED_UPDATE_LIMIT)
        throw (
          ((nestedPassiveUpdateCount = nestedUpdateCount = 0),
          (rootWithPassiveNestedUpdates = rootWithNestedUpdates = null),
          enableInfiniteRenderLoopDetection &&
            executionContext & RenderContext &&
            null !== workInProgressRoot &&
            (workInProgressRoot.errorRecoveryDisabledLanes |=
              workInProgressRootRenderLanes),
          Error(
            "Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate. React limits the number of nested updates to prevent infinite loops."
          ))
        );
      nestedPassiveUpdateCount > NESTED_PASSIVE_UPDATE_LIMIT &&
        ((nestedPassiveUpdateCount = 0),
        (rootWithPassiveNestedUpdates = null),
        console.error(
          "Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on every render."
        ));
    }
    function recursivelyTraverseAndDoubleInvokeEffectsInDEV(
      root$jscomp$0,
      parentFiber,
      isInStrictMode
    ) {
      if (0 !== (parentFiber.subtreeFlags & 67117056))
        for (parentFiber = parentFiber.child; null !== parentFiber; ) {
          var root = root$jscomp$0,
            fiber = parentFiber,
            isStrictModeFiber = fiber.type === REACT_STRICT_MODE_TYPE;
          isStrictModeFiber = isInStrictMode || isStrictModeFiber;
          22 !== fiber.tag
            ? fiber.flags & 67108864
              ? isStrictModeFiber &&
                runWithFiberInDEV(
                  fiber,
                  doubleInvokeEffectsOnFiber,
                  root,
                  fiber
                )
              : recursivelyTraverseAndDoubleInvokeEffectsInDEV(
                  root,
                  fiber,
                  isStrictModeFiber
                )
            : null === fiber.memoizedState &&
              (isStrictModeFiber && fiber.flags & 8192
                ? runWithFiberInDEV(
                    fiber,
                    doubleInvokeEffectsOnFiber,
                    root,
                    fiber
                  )
                : fiber.subtreeFlags & 67108864 &&
                  runWithFiberInDEV(
                    fiber,
                    recursivelyTraverseAndDoubleInvokeEffectsInDEV,
                    root,
                    fiber,
                    isStrictModeFiber
                  ));
          parentFiber = parentFiber.sibling;
        }
    }
    function doubleInvokeEffectsOnFiber(root, fiber) {
      setIsStrictModeForDevtools(!0);
      try {
        disappearLayoutEffects(fiber),
          disconnectPassiveEffect(fiber),
          reappearLayoutEffects(root, fiber.alternate, fiber, !1),
          reconnectPassiveEffects(root, fiber, 0, null, !1, 0);
      } finally {
        setIsStrictModeForDevtools(!1);
      }
    }
    function commitDoubleInvokeEffectsInDEV(root) {
      var doubleInvokeEffects = !0;
      root.current.mode & 24 || (doubleInvokeEffects = !1);
      recursivelyTraverseAndDoubleInvokeEffectsInDEV(
        root,
        root.current,
        doubleInvokeEffects
      );
    }
    function warnAboutUpdateOnNotYetMountedFiberInDEV(fiber) {
      if ((executionContext & RenderContext) === NoContext) {
        var tag = fiber.tag;
        if (
          3 === tag ||
          1 === tag ||
          0 === tag ||
          11 === tag ||
          14 === tag ||
          15 === tag
        ) {
          tag = getComponentNameFromFiber(fiber) || "ReactComponent";
          if (null !== didWarnStateUpdateForNotYetMountedComponent) {
            if (didWarnStateUpdateForNotYetMountedComponent.has(tag)) return;
            didWarnStateUpdateForNotYetMountedComponent.add(tag);
          } else didWarnStateUpdateForNotYetMountedComponent = new Set([tag]);
          runWithFiberInDEV(fiber, function () {
            console.error(
              "Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move this work to useEffect instead."
            );
          });
        }
      }
    }
    function restorePendingUpdaters(root, lanes) {
      isDevToolsPresent &&
        root.memoizedUpdaters.forEach(function (schedulingFiber) {
          addFiberToLanesMap(root, schedulingFiber, lanes);
        });
    }
    function scheduleCallback(priorityLevel, callback) {
      var actQueue = ReactSharedInternals.actQueue;
      return null !== actQueue
        ? (actQueue.push(callback), fakeActCallbackNode)
        : scheduleCallback$3(priorityLevel, callback);
    }
    function warnIfUpdatesNotWrappedWithActDEV(fiber) {
      isConcurrentActEnvironment() &&
        null === ReactSharedInternals.actQueue &&
        runWithFiberInDEV(fiber, function () {
          console.error(
            "An update to %s inside a test was not wrapped in act(...).\n\nWhen testing, code that causes React state updates should be wrapped into act(...):\n\nact(() => {\n  /* fire events that update state */\n});\n/* assert on the output */\n\nThis ensures that you're testing the behavior the user would see in the browser. Learn more at https://react.dev/link/wrap-tests-with-act",
            getComponentNameFromFiber(fiber)
          );
        });
    }
    function resolveFunctionForHotReloading(type) {
      if (null === resolveFamily) return type;
      var family = resolveFamily(type);
      return void 0 === family ? type : family.current;
    }
    function resolveForwardRefForHotReloading(type) {
      if (null === resolveFamily) return type;
      var family = resolveFamily(type);
      return void 0 === family
        ? null !== type &&
          void 0 !== type &&
          "function" === typeof type.render &&
          ((family = resolveFunctionForHotReloading(type.render)),
          type.render !== family)
          ? ((family = { $$typeof: REACT_FORWARD_REF_TYPE, render: family }),
            void 0 !== type.displayName &&
              (family.displayName = type.displayName),
            family)
          : type
        : family.current;
    }
    function isCompatibleFamilyForHotReloading(fiber, element) {
      if (null === resolveFamily) return !1;
      var prevType = fiber.elementType;
      element = element.type;
      var needsCompareFamilies = !1,
        $$typeofNextType =
          "object" === typeof element && null !== element
            ? element.$$typeof
            : null;
      switch (fiber.tag) {
        case 1:
          "function" === typeof element && (needsCompareFamilies = !0);
          break;
        case 0:
          "function" === typeof element
            ? (needsCompareFamilies = !0)
            : $$typeofNextType === REACT_LAZY_TYPE &&
              (needsCompareFamilies = !0);
          break;
        case 11:
          $$typeofNextType === REACT_FORWARD_REF_TYPE
            ? (needsCompareFamilies = !0)
            : $$typeofNextType === REACT_LAZY_TYPE &&
              (needsCompareFamilies = !0);
          break;
        case 14:
        case 15:
          $$typeofNextType === REACT_MEMO_TYPE
            ? (needsCompareFamilies = !0)
            : $$typeofNextType === REACT_LAZY_TYPE &&
              (needsCompareFamilies = !0);
          break;
        default:
          return !1;
      }
      return needsCompareFamilies &&
        ((fiber = resolveFamily(prevType)),
        void 0 !== fiber && fiber === resolveFamily(element))
        ? !0
        : !1;
    }
    function markFailedErrorBoundaryForHotReloading(fiber) {
      null !== resolveFamily &&
        "function" === typeof WeakSet &&
        (null === failedBoundaries && (failedBoundaries = new WeakSet()),
        failedBoundaries.add(fiber));
    }
    function scheduleFibersWithFamiliesRecursively(
      fiber,
      updatedFamilies,
      staleFamilies
    ) {
      do {
        var _fiber = fiber,
          alternate = _fiber.alternate,
          child = _fiber.child,
          sibling = _fiber.sibling,
          tag = _fiber.tag;
        _fiber = _fiber.type;
        var candidateType = null;
        switch (tag) {
          case 0:
          case 15:
          case 1:
            candidateType = _fiber;
            break;
          case 11:
            candidateType = _fiber.render;
        }
        if (null === resolveFamily)
          throw Error("Expected resolveFamily to be set during hot reload.");
        var needsRender = !1;
        _fiber = !1;
        null !== candidateType &&
          ((candidateType = resolveFamily(candidateType)),
          void 0 !== candidateType &&
            (staleFamilies.has(candidateType)
              ? (_fiber = !0)
              : updatedFamilies.has(candidateType) &&
                (1 === tag ? (_fiber = !0) : (needsRender = !0))));
        null !== failedBoundaries &&
          (failedBoundaries.has(fiber) ||
            (null !== alternate && failedBoundaries.has(alternate))) &&
          (_fiber = !0);
        _fiber && (fiber._debugNeedsRemount = !0);
        if (_fiber || needsRender)
          (alternate = enqueueConcurrentRenderForLane(fiber, 2)),
            null !== alternate && scheduleUpdateOnFiber(alternate, fiber, 2);
        null === child ||
          _fiber ||
          scheduleFibersWithFamiliesRecursively(
            child,
            updatedFamilies,
            staleFamilies
          );
        if (null === sibling) break;
        fiber = sibling;
      } while (1);
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
      this._debugTask =
        this._debugStack =
        this._debugOwner =
        this._debugInfo =
          null;
      this._debugNeedsRemount = !1;
      this._debugHookTypes = null;
      hasBadMapPolyfill ||
        "function" !== typeof Object.preventExtensions ||
        Object.preventExtensions(this);
    }
    function createFiberImplClass(tag, pendingProps, key, mode) {
      return new FiberNode(tag, pendingProps, key, mode);
    }
    function createFiberImplObject(tag, pendingProps, key, mode) {
      tag = {
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
        treeBaseDuration: -0,
        _debugInfo: null,
        _debugOwner: null,
        _debugStack: null,
        _debugTask: null,
        _debugNeedsRemount: !1,
        _debugHookTypes: null
      };
      hasBadMapPolyfill ||
        "function" !== typeof Object.preventExtensions ||
        Object.preventExtensions(tag);
      return tag;
    }
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
          (workInProgress._debugOwner = current._debugOwner),
          (workInProgress._debugStack = current._debugStack),
          (workInProgress._debugTask = current._debugTask),
          (workInProgress._debugHookTypes = current._debugHookTypes),
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
          : {
              lanes: pendingProps.lanes,
              firstContext: pendingProps.firstContext,
              _debugThenableState: pendingProps._debugThenableState
            };
      workInProgress.sibling = current.sibling;
      workInProgress.index = current.index;
      workInProgress.ref = current.ref;
      workInProgress.refCleanup = current.refCleanup;
      workInProgress.selfBaseDuration = current.selfBaseDuration;
      workInProgress.treeBaseDuration = current.treeBaseDuration;
      workInProgress._debugInfo = current._debugInfo;
      workInProgress._debugNeedsRemount = current._debugNeedsRemount;
      switch (workInProgress.tag) {
        case 0:
        case 15:
          workInProgress.type = resolveFunctionForHotReloading(current.type);
          break;
        case 1:
          workInProgress.type = resolveFunctionForHotReloading(current.type);
          break;
        case 11:
          workInProgress.type = resolveForwardRefForHotReloading(current.type);
      }
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
                  firstContext: renderLanes.firstContext,
                  _debugThenableState: renderLanes._debugThenableState
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
      var fiberTag = 0,
        resolvedType = type;
      if ("function" === typeof type)
        shouldConstruct(type) && (fiberTag = 1),
          (resolvedType = resolveFunctionForHotReloading(resolvedType));
      else if ("string" === typeof type)
        supportsResources && supportsSingletons
          ? ((fiberTag = getHostContext()),
            (fiberTag = isHostHoistableType(type, pendingProps, fiberTag)
              ? 26
              : isHostSingletonType(type)
                ? 27
                : 5))
          : supportsResources
            ? ((fiberTag = getHostContext()),
              (fiberTag = isHostHoistableType(type, pendingProps, fiberTag)
                ? 26
                : 5))
            : (fiberTag = supportsSingletons
                ? isHostSingletonType(type)
                  ? 27
                  : 5
                : 5);
      else
        a: switch (type) {
          case REACT_ACTIVITY_TYPE:
            return (
              (key = createFiber(31, pendingProps, key, mode)),
              (key.elementType = REACT_ACTIVITY_TYPE),
              (key.lanes = lanes),
              key
            );
          case REACT_FRAGMENT_TYPE:
            return createFiberFromFragment(
              pendingProps.children,
              mode,
              lanes,
              key
            );
          case REACT_STRICT_MODE_TYPE:
            fiberTag = 8;
            mode |= 24;
            break;
          case REACT_PROFILER_TYPE:
            return (
              (type = pendingProps),
              "string" !== typeof type.id &&
                console.error(
                  'Profiler must specify an "id" of type `string` as a prop. Received the type `%s` instead.',
                  typeof type.id
                ),
              (key = createFiber(12, type, key, mode | 2)),
              (key.elementType = REACT_PROFILER_TYPE),
              (key.lanes = lanes),
              (key.stateNode = { effectDuration: 0, passiveEffectDuration: 0 }),
              key
            );
          case REACT_SUSPENSE_TYPE:
            return (
              (key = createFiber(13, pendingProps, key, mode)),
              (key.elementType = REACT_SUSPENSE_TYPE),
              (key.lanes = lanes),
              key
            );
          case REACT_SUSPENSE_LIST_TYPE:
            return (
              (key = createFiber(19, pendingProps, key, mode)),
              (key.elementType = REACT_SUSPENSE_LIST_TYPE),
              (key.lanes = lanes),
              key
            );
          case REACT_LEGACY_HIDDEN_TYPE:
            return (
              (key = createFiber(23, pendingProps, key, mode)),
              (key.elementType = REACT_LEGACY_HIDDEN_TYPE),
              (key.lanes = lanes),
              key
            );
          case REACT_VIEW_TRANSITION_TYPE:
            if (enableViewTransition)
              return (
                (type = mode | 32),
                (key = createFiber(30, pendingProps, key, type)),
                (key.elementType = REACT_VIEW_TRANSITION_TYPE),
                (key.lanes = lanes),
                (key.stateNode = {
                  autoName: null,
                  paired: null,
                  clones: null,
                  ref: null
                }),
                key
              );
          case REACT_SCOPE_TYPE:
            return (
              (key = createFiber(21, pendingProps, key, mode)),
              (key.type = type),
              (key.elementType = type),
              (key.lanes = lanes),
              key
            );
          case REACT_TRACING_MARKER_TYPE:
            if (enableTransitionTracing)
              return (
                (type = pendingProps),
                (key = createFiber(25, type, key, mode)),
                (key.elementType = REACT_TRACING_MARKER_TYPE),
                (key.lanes = lanes),
                (key.stateNode = {
                  tag: TransitionTracingMarker,
                  transitions: null,
                  pendingBoundaries: null,
                  aborts: null,
                  name: type.name
                }),
                key
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
                  resolvedType = resolveForwardRefForHotReloading(resolvedType);
                  break a;
                case REACT_MEMO_TYPE:
                  fiberTag = 14;
                  break a;
                case REACT_LAZY_TYPE:
                  fiberTag = 16;
                  resolvedType = null;
                  break a;
              }
            pendingProps = "";
            if (
              void 0 === type ||
              ("object" === typeof type &&
                null !== type &&
                0 === Object.keys(type).length)
            )
              pendingProps +=
                " You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.";
            null === type
              ? (resolvedType = "null")
              : isArrayImpl(type)
                ? (resolvedType = "array")
                : void 0 !== type && type.$$typeof === REACT_ELEMENT_TYPE
                  ? ((resolvedType =
                      "<" +
                      (getComponentNameFromType(type.type) || "Unknown") +
                      " />"),
                    (pendingProps =
                      " Did you accidentally export a JSX literal instead of a component?"))
                  : (resolvedType = typeof type);
            fiberTag = owner
              ? "number" === typeof owner.tag
                ? getComponentNameFromFiber(owner)
                : "string" === typeof owner.name
                  ? owner.name
                  : null
              : null;
            fiberTag &&
              (pendingProps +=
                "\n\nCheck the render method of `" + fiberTag + "`.");
            fiberTag = 29;
            pendingProps = Error(
              "Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: " +
                (resolvedType + "." + pendingProps)
            );
            resolvedType = null;
        }
      key = createFiber(fiberTag, pendingProps, key, mode);
      key.elementType = type;
      key.type = resolvedType;
      key.lanes = lanes;
      key._debugOwner = owner;
      return key;
    }
    function createFiberFromElement(element, mode, lanes) {
      mode = createFiberFromTypeAndProps(
        element.type,
        element.key,
        element.props,
        element._owner,
        mode,
        lanes
      );
      mode._debugOwner = element._owner;
      mode._debugStack = element._debugStack;
      mode._debugTask = element._debugTask;
      return mode;
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
      var fiber = createFiber(18, null, null, NoMode);
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
      this.tag = 1;
      this.containerInfo = containerInfo;
      this.pingCache = this.current = this.pendingChildren = null;
      this.timeoutHandle = noTimeout;
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
      enableViewTransition && (this.transitionTypes = null);
      this.incompleteTransitions = new Map();
      enableTransitionTracing &&
        ((this.transitionCallbacks = null),
        (this.transitionLanes = createLaneMap(null)));
      this.passiveEffectDuration = this.effectDuration = -0;
      this.memoizedUpdaters = new Set();
      containerInfo = this.pendingUpdatersLaneMap = [];
      for (tag = 0; 31 > tag; tag++) containerInfo.push(new Set());
      this._debugRootType = hydrate ? "hydrateRoot()" : "createRoot()";
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
      onDefaultTransitionIndicator,
      transitionCallbacks
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
      enableTransitionTracing &&
        (containerInfo.transitionCallbacks = transitionCallbacks);
      hydrationCallbacks = 1;
      !0 === isStrictMode && (hydrationCallbacks |= 24);
      isStrictMode = createFiber(3, null, null, hydrationCallbacks | 2);
      containerInfo.current = isStrictMode;
      isStrictMode.stateNode = containerInfo;
      hydrationCallbacks = createCache();
      retainCache(hydrationCallbacks);
      containerInfo.pooledCache = hydrationCallbacks;
      retainCache(hydrationCallbacks);
      isStrictMode.memoizedState = {
        element: initialChildren,
        isDehydrated: hydrate,
        cache: hydrationCallbacks
      };
      initializeUpdateQueue(isStrictMode);
      return containerInfo;
    }
    function testStringCoercion(value) {
      return "" + value;
    }
    function getContextForSubtree(parentComponent) {
      if (!parentComponent) return emptyContextObject;
      parentComponent = emptyContextObject;
      return parentComponent;
    }
    function updateContainerSync(
      element,
      container,
      parentComponent,
      callback
    ) {
      updateContainerImpl(
        container.current,
        2,
        element,
        container,
        parentComponent,
        callback
      );
      return 2;
    }
    function updateContainerImpl(
      rootFiber,
      lane,
      element,
      container,
      parentComponent,
      callback
    ) {
      if (
        injectedHook &&
        "function" === typeof injectedHook.onScheduleFiberRoot
      )
        try {
          injectedHook.onScheduleFiberRoot(rendererID, container, element);
        } catch (err) {
          hasLoggedError ||
            ((hasLoggedError = !0),
            console.error(
              "React instrumentation encountered an error: %o",
              err
            ));
        }
      enableSchedulingProfiler &&
        enableSchedulingProfiler &&
        null !== injectedProfilingHooks &&
        "function" === typeof injectedProfilingHooks.markRenderScheduled &&
        injectedProfilingHooks.markRenderScheduled(lane);
      parentComponent = getContextForSubtree(parentComponent);
      null === container.context
        ? (container.context = parentComponent)
        : (container.pendingContext = parentComponent);
      isRendering &&
        null !== current &&
        !didWarnAboutNestedUpdates &&
        ((didWarnAboutNestedUpdates = !0),
        console.error(
          "Render methods should be a pure function of props and state; triggering nested component updates from render is not allowed. If necessary, trigger nested updates in componentDidUpdate.\n\nCheck the render method of %s.",
          getComponentNameFromFiber(current) || "Unknown"
        ));
      container = createUpdate(lane);
      container.payload = { element: element };
      callback = void 0 === callback ? null : callback;
      null !== callback &&
        ("function" !== typeof callback &&
          console.error(
            "Expected the last optional `callback` argument to be a function. Instead received: %s.",
            callback
          ),
        (container.callback = callback));
      element = enqueueUpdate(rootFiber, container, lane);
      null !== element &&
        (startUpdateTimerByLane(lane, "root.render()", null),
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
    function getCurrentFiberForDevTools() {
      return current;
    }
    function getLaneLabelMap() {
      if (enableSchedulingProfiler) {
        for (var map = new Map(), lane = 1, index = 0; 31 > index; index++) {
          var label = getLabelForLane(lane);
          map.set(lane, label);
          lane *= 2;
        }
        return map;
      }
      return null;
    }
    var exports = {};
    ("use strict");
    var React = require("react"),
      Scheduler = require("scheduler"),
      assign = Object.assign,
      dynamicFeatureFlags = require("ReactFeatureFlags"),
      alwaysThrottleRetries = dynamicFeatureFlags.alwaysThrottleRetries,
      disableSchedulerTimeoutInWorkLoop =
        dynamicFeatureFlags.disableSchedulerTimeoutInWorkLoop,
      enableHiddenSubtreeInsertionEffectCleanup =
        dynamicFeatureFlags.enableHiddenSubtreeInsertionEffectCleanup,
      enableInfiniteRenderLoopDetection =
        dynamicFeatureFlags.enableInfiniteRenderLoopDetection,
      enableNoCloningMemoCache = dynamicFeatureFlags.enableNoCloningMemoCache,
      enableObjectFiber = dynamicFeatureFlags.enableObjectFiber,
      enableRetryLaneExpiration = dynamicFeatureFlags.enableRetryLaneExpiration,
      enableTransitionTracing = dynamicFeatureFlags.enableTransitionTracing,
      renameElementSymbol = dynamicFeatureFlags.renameElementSymbol,
      retryLaneExpirationMs = dynamicFeatureFlags.retryLaneExpirationMs,
      syncLaneExpirationMs = dynamicFeatureFlags.syncLaneExpirationMs,
      transitionLaneExpirationMs =
        dynamicFeatureFlags.transitionLaneExpirationMs,
      enableViewTransition = dynamicFeatureFlags.enableViewTransition,
      enableComponentPerformanceTrack =
        dynamicFeatureFlags.enableComponentPerformanceTrack,
      enableFragmentRefs = dynamicFeatureFlags.enableFragmentRefs,
      enableAsyncDebugInfo = dynamicFeatureFlags.enableAsyncDebugInfo,
      enableSchedulingProfiler = dynamicFeatureFlags.enableSchedulingProfiler,
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
      REACT_LAZY_TYPE = Symbol.for("react.lazy"),
      REACT_SCOPE_TYPE = Symbol.for("react.scope"),
      REACT_ACTIVITY_TYPE = Symbol.for("react.activity"),
      REACT_LEGACY_HIDDEN_TYPE = Symbol.for("react.legacy_hidden"),
      REACT_TRACING_MARKER_TYPE = Symbol.for("react.tracing_marker"),
      REACT_MEMO_CACHE_SENTINEL = Symbol.for("react.memo_cache_sentinel"),
      REACT_VIEW_TRANSITION_TYPE = Symbol.for("react.view_transition"),
      MAYBE_ITERATOR_SYMBOL = Symbol.iterator,
      REACT_CLIENT_REFERENCE = Symbol.for("react.client.reference"),
      isArrayImpl = Array.isArray,
      ReactSharedInternals =
        React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,
      rendererVersion = $$$config.rendererVersion,
      rendererPackageName = $$$config.rendererPackageName,
      extraDevToolsConfig = $$$config.extraDevToolsConfig,
      getPublicInstance = $$$config.getPublicInstance,
      getRootHostContext = $$$config.getRootHostContext,
      getChildHostContext = $$$config.getChildHostContext,
      prepareForCommit = $$$config.prepareForCommit,
      resetAfterCommit = $$$config.resetAfterCommit,
      createInstance = $$$config.createInstance;
    $$$config.cloneMutableInstance;
    var appendInitialChild = $$$config.appendInitialChild,
      finalizeInitialChildren = $$$config.finalizeInitialChildren,
      shouldSetTextContent = $$$config.shouldSetTextContent,
      createTextInstance = $$$config.createTextInstance;
    $$$config.cloneMutableTextInstance;
    var scheduleTimeout = $$$config.scheduleTimeout,
      cancelTimeout = $$$config.cancelTimeout,
      noTimeout = $$$config.noTimeout,
      isPrimaryRenderer = $$$config.isPrimaryRenderer;
    $$$config.warnsIfNotActing;
    var supportsMutation = $$$config.supportsMutation,
      supportsPersistence = $$$config.supportsPersistence,
      supportsHydration = $$$config.supportsHydration,
      getInstanceFromNode = $$$config.getInstanceFromNode,
      beforeActiveInstanceBlur = $$$config.beforeActiveInstanceBlur,
      afterActiveInstanceBlur = $$$config.afterActiveInstanceBlur,
      preparePortalMount = $$$config.preparePortalMount,
      prepareScopeUpdate = $$$config.prepareScopeUpdate,
      getInstanceFromScope = $$$config.getInstanceFromScope,
      setCurrentUpdatePriority = $$$config.setCurrentUpdatePriority,
      getCurrentUpdatePriority = $$$config.getCurrentUpdatePriority,
      resolveUpdatePriority = $$$config.resolveUpdatePriority,
      trackSchedulerEvent = $$$config.trackSchedulerEvent,
      resolveEventType = $$$config.resolveEventType,
      resolveEventTimeStamp = $$$config.resolveEventTimeStamp,
      shouldAttemptEagerTransition = $$$config.shouldAttemptEagerTransition,
      detachDeletedInstance = $$$config.detachDeletedInstance,
      requestPostPaintCallback = $$$config.requestPostPaintCallback,
      maySuspendCommit = $$$config.maySuspendCommit,
      maySuspendCommitOnUpdate = $$$config.maySuspendCommitOnUpdate,
      maySuspendCommitInSyncRender = $$$config.maySuspendCommitInSyncRender,
      preloadInstance = $$$config.preloadInstance,
      startSuspendingCommit = $$$config.startSuspendingCommit,
      suspendInstance = $$$config.suspendInstance,
      suspendOnActiveViewTransition = $$$config.suspendOnActiveViewTransition,
      waitForCommitToBeReady = $$$config.waitForCommitToBeReady,
      getSuspendedCommitReason = $$$config.getSuspendedCommitReason,
      NotPendingTransition = $$$config.NotPendingTransition,
      HostTransitionContext = $$$config.HostTransitionContext,
      resetFormInstance = $$$config.resetFormInstance,
      bindToConsole = $$$config.bindToConsole,
      supportsMicrotasks = $$$config.supportsMicrotasks,
      scheduleMicrotask = $$$config.scheduleMicrotask,
      supportsTestSelectors = $$$config.supportsTestSelectors,
      findFiberRoot = $$$config.findFiberRoot,
      getBoundingRect = $$$config.getBoundingRect,
      getTextContent = $$$config.getTextContent,
      isHiddenSubtree = $$$config.isHiddenSubtree,
      matchAccessibilityRole = $$$config.matchAccessibilityRole,
      setFocusIfFocusable = $$$config.setFocusIfFocusable,
      setupIntersectionObserver = $$$config.setupIntersectionObserver,
      appendChild = $$$config.appendChild,
      appendChildToContainer = $$$config.appendChildToContainer,
      commitTextUpdate = $$$config.commitTextUpdate,
      commitMount = $$$config.commitMount,
      commitUpdate = $$$config.commitUpdate,
      insertBefore = $$$config.insertBefore,
      insertInContainerBefore = $$$config.insertInContainerBefore,
      removeChild = $$$config.removeChild,
      removeChildFromContainer = $$$config.removeChildFromContainer,
      resetTextContent = $$$config.resetTextContent,
      hideInstance = $$$config.hideInstance,
      hideTextInstance = $$$config.hideTextInstance,
      unhideInstance = $$$config.unhideInstance,
      unhideTextInstance = $$$config.unhideTextInstance,
      applyViewTransitionName = $$$config.applyViewTransitionName,
      restoreViewTransitionName = $$$config.restoreViewTransitionName,
      cancelViewTransitionName = $$$config.cancelViewTransitionName,
      cancelRootViewTransitionName = $$$config.cancelRootViewTransitionName,
      restoreRootViewTransitionName = $$$config.restoreRootViewTransitionName;
    $$$config.cloneRootViewTransitionContainer;
    $$$config.removeRootViewTransitionClone;
    var measureInstance = $$$config.measureInstance,
      measureClonedInstance = $$$config.measureClonedInstance,
      wasInstanceInViewport = $$$config.wasInstanceInViewport,
      hasInstanceChanged = $$$config.hasInstanceChanged,
      hasInstanceAffectedParent = $$$config.hasInstanceAffectedParent,
      startViewTransition = $$$config.startViewTransition;
    $$$config.startGestureTransition;
    var stopViewTransition = $$$config.stopViewTransition;
    $$$config.getCurrentGestureOffset;
    var createViewTransitionInstance = $$$config.createViewTransitionInstance,
      clearContainer = $$$config.clearContainer,
      createFragmentInstance = $$$config.createFragmentInstance,
      updateFragmentInstanceFiber = $$$config.updateFragmentInstanceFiber,
      commitNewChildToFragmentInstance =
        $$$config.commitNewChildToFragmentInstance,
      deleteChildFromFragmentInstance =
        $$$config.deleteChildFromFragmentInstance,
      cloneInstance = $$$config.cloneInstance,
      createContainerChildSet = $$$config.createContainerChildSet,
      appendChildToContainerChildSet = $$$config.appendChildToContainerChildSet,
      finalizeContainerChildren = $$$config.finalizeContainerChildren,
      replaceContainerChildren = $$$config.replaceContainerChildren,
      cloneHiddenInstance = $$$config.cloneHiddenInstance,
      cloneHiddenTextInstance = $$$config.cloneHiddenTextInstance,
      isSuspenseInstancePending = $$$config.isSuspenseInstancePending,
      isSuspenseInstanceFallback = $$$config.isSuspenseInstanceFallback,
      getSuspenseInstanceFallbackErrorDetails =
        $$$config.getSuspenseInstanceFallbackErrorDetails,
      registerSuspenseInstanceRetry = $$$config.registerSuspenseInstanceRetry,
      canHydrateFormStateMarker = $$$config.canHydrateFormStateMarker,
      isFormStateMarkerMatching = $$$config.isFormStateMarkerMatching,
      getNextHydratableSibling = $$$config.getNextHydratableSibling,
      getNextHydratableSiblingAfterSingleton =
        $$$config.getNextHydratableSiblingAfterSingleton,
      getFirstHydratableChild = $$$config.getFirstHydratableChild,
      getFirstHydratableChildWithinContainer =
        $$$config.getFirstHydratableChildWithinContainer,
      getFirstHydratableChildWithinActivityInstance =
        $$$config.getFirstHydratableChildWithinActivityInstance,
      getFirstHydratableChildWithinSuspenseInstance =
        $$$config.getFirstHydratableChildWithinSuspenseInstance,
      getFirstHydratableChildWithinSingleton =
        $$$config.getFirstHydratableChildWithinSingleton,
      canHydrateInstance = $$$config.canHydrateInstance,
      canHydrateTextInstance = $$$config.canHydrateTextInstance,
      canHydrateActivityInstance = $$$config.canHydrateActivityInstance,
      canHydrateSuspenseInstance = $$$config.canHydrateSuspenseInstance,
      hydrateInstance = $$$config.hydrateInstance,
      hydrateTextInstance = $$$config.hydrateTextInstance,
      hydrateActivityInstance = $$$config.hydrateActivityInstance,
      hydrateSuspenseInstance = $$$config.hydrateSuspenseInstance,
      getNextHydratableInstanceAfterActivityInstance =
        $$$config.getNextHydratableInstanceAfterActivityInstance,
      getNextHydratableInstanceAfterSuspenseInstance =
        $$$config.getNextHydratableInstanceAfterSuspenseInstance,
      commitHydratedInstance = $$$config.commitHydratedInstance,
      commitHydratedContainer = $$$config.commitHydratedContainer,
      commitHydratedActivityInstance = $$$config.commitHydratedActivityInstance,
      commitHydratedSuspenseInstance = $$$config.commitHydratedSuspenseInstance,
      finalizeHydratedChildren = $$$config.finalizeHydratedChildren,
      flushHydrationEvents = $$$config.flushHydrationEvents;
    $$$config.clearActivityBoundary;
    var clearSuspenseBoundary = $$$config.clearSuspenseBoundary;
    $$$config.clearActivityBoundaryFromContainer;
    var clearSuspenseBoundaryFromContainer =
        $$$config.clearSuspenseBoundaryFromContainer,
      hideDehydratedBoundary = $$$config.hideDehydratedBoundary,
      unhideDehydratedBoundary = $$$config.unhideDehydratedBoundary,
      shouldDeleteUnhydratedTailInstances =
        $$$config.shouldDeleteUnhydratedTailInstances,
      diffHydratedPropsForDevWarnings =
        $$$config.diffHydratedPropsForDevWarnings,
      diffHydratedTextForDevWarnings = $$$config.diffHydratedTextForDevWarnings,
      describeHydratableInstanceForDevWarnings =
        $$$config.describeHydratableInstanceForDevWarnings,
      validateHydratableInstance = $$$config.validateHydratableInstance,
      validateHydratableTextInstance = $$$config.validateHydratableTextInstance,
      supportsResources = $$$config.supportsResources,
      isHostHoistableType = $$$config.isHostHoistableType,
      getHoistableRoot = $$$config.getHoistableRoot,
      getResource = $$$config.getResource,
      acquireResource = $$$config.acquireResource,
      releaseResource = $$$config.releaseResource,
      hydrateHoistable = $$$config.hydrateHoistable,
      mountHoistable = $$$config.mountHoistable,
      unmountHoistable = $$$config.unmountHoistable,
      createHoistableInstance = $$$config.createHoistableInstance,
      prepareToCommitHoistables = $$$config.prepareToCommitHoistables,
      mayResourceSuspendCommit = $$$config.mayResourceSuspendCommit,
      preloadResource = $$$config.preloadResource,
      suspendResource = $$$config.suspendResource,
      supportsSingletons = $$$config.supportsSingletons,
      resolveSingletonInstance = $$$config.resolveSingletonInstance,
      acquireSingletonInstance = $$$config.acquireSingletonInstance,
      releaseSingletonInstance = $$$config.releaseSingletonInstance,
      isHostSingletonType = $$$config.isHostSingletonType,
      isSingletonScope = $$$config.isSingletonScope,
      valueStack = [];
    var fiberStack = [];
    var index$jscomp$0 = -1,
      emptyContextObject = {};
    Object.freeze(emptyContextObject);
    var clz32 = Math.clz32 ? Math.clz32 : clz32Fallback,
      log$1 = Math.log,
      LN2 = Math.LN2,
      nextTransitionUpdateLane = 256,
      nextTransitionDeferredLane = 262144,
      nextRetryLane = 4194304,
      scheduleCallback$3 = Scheduler.unstable_scheduleCallback,
      cancelCallback$1 = Scheduler.unstable_cancelCallback,
      shouldYield = Scheduler.unstable_shouldYield,
      requestPaint = Scheduler.unstable_requestPaint,
      now$1 = Scheduler.unstable_now,
      ImmediatePriority = Scheduler.unstable_ImmediatePriority,
      UserBlockingPriority = Scheduler.unstable_UserBlockingPriority,
      NormalPriority$1 = Scheduler.unstable_NormalPriority,
      IdlePriority = Scheduler.unstable_IdlePriority,
      log = Scheduler.log,
      unstable_setDisableYieldValue = Scheduler.unstable_setDisableYieldValue,
      rendererID = null,
      injectedHook = null,
      injectedProfilingHooks = null,
      hasLoggedError = !1,
      isDevToolsPresent = "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__,
      globalClientIdCounter$1 = 0,
      lastResetTime = 0;
    if (
      "object" === typeof performance &&
      "function" === typeof performance.now
    ) {
      var localPerformance = performance;
      var getCurrentTime = function () {
        return localPerformance.now();
      };
    } else {
      var localDate = Date;
      getCurrentTime = function () {
        return localDate.now();
      };
    }
    var objectIs = "function" === typeof Object.is ? Object.is : is,
      reportGlobalError =
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
      hasOwnProperty = Object.prototype.hasOwnProperty,
      supportsUserTiming =
        "undefined" !== typeof console &&
        "function" === typeof console.timeStamp &&
        "undefined" !== typeof performance &&
        "function" === typeof performance.measure,
      currentTrack = "Blocking",
      alreadyWarnedForDeepEquality = !1,
      reusableComponentDevToolDetails = {
        color: "primary",
        properties: null,
        tooltipText: "",
        track: "Components \u269b"
      },
      reusableComponentOptions = {
        start: -0,
        end: -0,
        detail: { devtools: reusableComponentDevToolDetails }
      },
      reusableChangedPropsEntry = ["Changed Props", ""],
      reusableDeeplyEqualPropsEntry = [
        "Changed Props",
        "This component received deeply equal props. It might benefit from useMemo or the React Compiler in its owner."
      ],
      disabledDepth = 0,
      prevLog,
      prevInfo,
      prevWarn,
      prevError,
      prevGroup,
      prevGroupCollapsed,
      prevGroupEnd;
    disabledLog.__reactDisabledLog = !0;
    var prefix,
      suffix,
      reentry = !1;
    var componentFrameCache = new (
      "function" === typeof WeakMap ? WeakMap : Map
    )();
    var CapturedStacks = new WeakMap(),
      forkStack = [],
      forkStackIndex = 0,
      treeForkProvider = null,
      treeForkCount = 0,
      idStack = [],
      idStackIndex = 0,
      treeContextProvider = null,
      treeContextId = 1,
      treeContextOverflow = "",
      contextStackCursor = createCursor(null),
      contextFiberStackCursor = createCursor(null),
      rootInstanceStackCursor = createCursor(null),
      hostTransitionProviderCursor = createCursor(null),
      needsEscaping = /["'&<>\n\t]|^\s|\s$/,
      current = null,
      isRendering = !1,
      hydrationParentFiber = null,
      nextHydratableInstance = null,
      isHydrating = !1,
      didSuspendOrErrorDEV = !1,
      hydrationDiffRootDEV = null,
      hydrationErrors = null,
      rootOrSingletonContext = !1,
      HydrationMismatchException = Error(
        "Hydration Mismatch Exception: This is not a real error, and should not leak into userspace. If you're seeing this, it's likely a bug in React."
      ),
      NoMode = 0,
      valueCursor = createCursor(null);
    var rendererCursorDEV = createCursor(null);
    var renderer2CursorDEV = createCursor(null);
    var rendererSigil = {};
    var currentlyRenderingFiber$1 = null,
      lastContextDependency = null,
      isDisallowedContextReadInDEV = !1,
      AbortControllerLocal =
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
        _threadCount: 0,
        _currentRenderer: null,
        _currentRenderer2: null
      },
      entangledTransitionTypes = null,
      now = Scheduler.unstable_now,
      createTask = console.createTask
        ? console.createTask
        : function () {
            return null;
          },
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
      blockingUpdateTask = null,
      blockingUpdateType = 0,
      blockingUpdateMethodName = null,
      blockingUpdateComponentName = null,
      blockingEventTime = -1.1,
      blockingEventType = null,
      blockingEventRepeatTime = -1.1,
      blockingSuspendedTime = -1.1,
      transitionClampTime = -0,
      transitionStartTime = -1.1,
      transitionUpdateTime = -1.1,
      transitionUpdateType = 0,
      transitionUpdateTask = null,
      transitionUpdateMethodName = null,
      transitionUpdateComponentName = null,
      transitionEventTime = -1.1,
      transitionEventType = null,
      transitionEventRepeatTime = -1.1,
      transitionSuspendedTime = -1.1,
      retryClampTime = -0,
      idleClampTime = -0,
      animatingLanes = 0,
      animatingTask = null,
      yieldReason = 0,
      yieldStartTime = -1.1,
      currentUpdateIsNested = !1,
      nestedUpdateScheduled = !1,
      firstScheduledRoot = null,
      lastScheduledRoot = null,
      didScheduleMicrotask = !1,
      didScheduleMicrotask_act = !1,
      mightHavePendingSyncWork = !1,
      isFlushingWork = !1,
      currentEventTransitionLane = 0,
      fakeActCallbackNode$1 = {},
      currentEntangledListeners = null,
      currentEntangledPendingCount = 0,
      currentEntangledLane = 0,
      currentEntangledActionThenable = null,
      isomorphicDefaultTransitionIndicator = void 0,
      pendingIsomorphicIndicator = null,
      pendingEntangledRoots = 0,
      needsIsomorphicIndicator = !1,
      prevOnStartTransitionFinish = ReactSharedInternals.S;
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
      if (enableViewTransition) {
        if (null !== entangledTransitionTypes)
          for (newEventTime = firstScheduledRoot; null !== newEventTime; )
            queueTransitionTypes(newEventTime, entangledTransitionTypes),
              (newEventTime = newEventTime.next);
        newEventTime = transition.types;
        if (null !== newEventTime) {
          for (newEventType = firstScheduledRoot; null !== newEventType; )
            queueTransitionTypes(newEventType, newEventTime),
              (newEventType = newEventType.next);
          if (0 !== currentEntangledLane && enableViewTransition) {
            newEventType = entangledTransitionTypes;
            null === newEventType &&
              (newEventType = entangledTransitionTypes = []);
            for (var i = 0; i < newEventTime.length; i++) {
              var transitionType = newEventTime[i];
              -1 === newEventType.indexOf(transitionType) &&
                newEventType.push(transitionType);
            }
          }
        }
      }
      null !== prevOnStartTransitionFinish &&
        prevOnStartTransitionFinish(transition, returnValue);
    };
    var resumedCache = createCursor(null),
      transitionStack = createCursor(null),
      ReactStrictModeWarnings = {
        recordUnsafeLifecycleWarnings: function () {},
        flushPendingUnsafeLifecycleWarnings: function () {},
        recordLegacyContextWarning: function () {},
        flushLegacyContextWarning: function () {},
        discardPendingWarnings: function () {}
      },
      pendingComponentWillMountWarnings = [],
      pendingUNSAFE_ComponentWillMountWarnings = [],
      pendingComponentWillReceivePropsWarnings = [],
      pendingUNSAFE_ComponentWillReceivePropsWarnings = [],
      pendingComponentWillUpdateWarnings = [],
      pendingUNSAFE_ComponentWillUpdateWarnings = [],
      didWarnAboutUnsafeLifecycles = new Set();
    ReactStrictModeWarnings.recordUnsafeLifecycleWarnings = function (
      fiber,
      instance
    ) {
      didWarnAboutUnsafeLifecycles.has(fiber.type) ||
        ("function" === typeof instance.componentWillMount &&
          !0 !== instance.componentWillMount.__suppressDeprecationWarning &&
          pendingComponentWillMountWarnings.push(fiber),
        fiber.mode & 8 &&
          "function" === typeof instance.UNSAFE_componentWillMount &&
          pendingUNSAFE_ComponentWillMountWarnings.push(fiber),
        "function" === typeof instance.componentWillReceiveProps &&
          !0 !==
            instance.componentWillReceiveProps.__suppressDeprecationWarning &&
          pendingComponentWillReceivePropsWarnings.push(fiber),
        fiber.mode & 8 &&
          "function" === typeof instance.UNSAFE_componentWillReceiveProps &&
          pendingUNSAFE_ComponentWillReceivePropsWarnings.push(fiber),
        "function" === typeof instance.componentWillUpdate &&
          !0 !== instance.componentWillUpdate.__suppressDeprecationWarning &&
          pendingComponentWillUpdateWarnings.push(fiber),
        fiber.mode & 8 &&
          "function" === typeof instance.UNSAFE_componentWillUpdate &&
          pendingUNSAFE_ComponentWillUpdateWarnings.push(fiber));
    };
    ReactStrictModeWarnings.flushPendingUnsafeLifecycleWarnings = function () {
      var componentWillMountUniqueNames = new Set();
      0 < pendingComponentWillMountWarnings.length &&
        (pendingComponentWillMountWarnings.forEach(function (fiber) {
          componentWillMountUniqueNames.add(
            getComponentNameFromFiber(fiber) || "Component"
          );
          didWarnAboutUnsafeLifecycles.add(fiber.type);
        }),
        (pendingComponentWillMountWarnings = []));
      var UNSAFE_componentWillMountUniqueNames = new Set();
      0 < pendingUNSAFE_ComponentWillMountWarnings.length &&
        (pendingUNSAFE_ComponentWillMountWarnings.forEach(function (fiber) {
          UNSAFE_componentWillMountUniqueNames.add(
            getComponentNameFromFiber(fiber) || "Component"
          );
          didWarnAboutUnsafeLifecycles.add(fiber.type);
        }),
        (pendingUNSAFE_ComponentWillMountWarnings = []));
      var componentWillReceivePropsUniqueNames = new Set();
      0 < pendingComponentWillReceivePropsWarnings.length &&
        (pendingComponentWillReceivePropsWarnings.forEach(function (fiber) {
          componentWillReceivePropsUniqueNames.add(
            getComponentNameFromFiber(fiber) || "Component"
          );
          didWarnAboutUnsafeLifecycles.add(fiber.type);
        }),
        (pendingComponentWillReceivePropsWarnings = []));
      var UNSAFE_componentWillReceivePropsUniqueNames = new Set();
      0 < pendingUNSAFE_ComponentWillReceivePropsWarnings.length &&
        (pendingUNSAFE_ComponentWillReceivePropsWarnings.forEach(
          function (fiber) {
            UNSAFE_componentWillReceivePropsUniqueNames.add(
              getComponentNameFromFiber(fiber) || "Component"
            );
            didWarnAboutUnsafeLifecycles.add(fiber.type);
          }
        ),
        (pendingUNSAFE_ComponentWillReceivePropsWarnings = []));
      var componentWillUpdateUniqueNames = new Set();
      0 < pendingComponentWillUpdateWarnings.length &&
        (pendingComponentWillUpdateWarnings.forEach(function (fiber) {
          componentWillUpdateUniqueNames.add(
            getComponentNameFromFiber(fiber) || "Component"
          );
          didWarnAboutUnsafeLifecycles.add(fiber.type);
        }),
        (pendingComponentWillUpdateWarnings = []));
      var UNSAFE_componentWillUpdateUniqueNames = new Set();
      0 < pendingUNSAFE_ComponentWillUpdateWarnings.length &&
        (pendingUNSAFE_ComponentWillUpdateWarnings.forEach(function (fiber) {
          UNSAFE_componentWillUpdateUniqueNames.add(
            getComponentNameFromFiber(fiber) || "Component"
          );
          didWarnAboutUnsafeLifecycles.add(fiber.type);
        }),
        (pendingUNSAFE_ComponentWillUpdateWarnings = []));
      if (0 < UNSAFE_componentWillMountUniqueNames.size) {
        var sortedNames = setToSortedString(
          UNSAFE_componentWillMountUniqueNames
        );
        console.error(
          "Using UNSAFE_componentWillMount in strict mode is not recommended and may indicate bugs in your code. See https://react.dev/link/unsafe-component-lifecycles for details.\n\n* Move code with side effects to componentDidMount, and set initial state in the constructor.\n\nPlease update the following components: %s",
          sortedNames
        );
      }
      0 < UNSAFE_componentWillReceivePropsUniqueNames.size &&
        ((sortedNames = setToSortedString(
          UNSAFE_componentWillReceivePropsUniqueNames
        )),
        console.error(
          "Using UNSAFE_componentWillReceiveProps in strict mode is not recommended and may indicate bugs in your code. See https://react.dev/link/unsafe-component-lifecycles for details.\n\n* Move data fetching code or side effects to componentDidUpdate.\n* If you're updating state whenever props change, refactor your code to use memoization techniques or move it to static getDerivedStateFromProps. Learn more at: https://react.dev/link/derived-state\n\nPlease update the following components: %s",
          sortedNames
        ));
      0 < UNSAFE_componentWillUpdateUniqueNames.size &&
        ((sortedNames = setToSortedString(
          UNSAFE_componentWillUpdateUniqueNames
        )),
        console.error(
          "Using UNSAFE_componentWillUpdate in strict mode is not recommended and may indicate bugs in your code. See https://react.dev/link/unsafe-component-lifecycles for details.\n\n* Move data fetching code or side effects to componentDidUpdate.\n\nPlease update the following components: %s",
          sortedNames
        ));
      0 < componentWillMountUniqueNames.size &&
        ((sortedNames = setToSortedString(componentWillMountUniqueNames)),
        console.warn(
          "componentWillMount has been renamed, and is not recommended for use. See https://react.dev/link/unsafe-component-lifecycles for details.\n\n* Move code with side effects to componentDidMount, and set initial state in the constructor.\n* Rename componentWillMount to UNSAFE_componentWillMount to suppress this warning in non-strict mode. In React 18.x, only the UNSAFE_ name will work. To rename all deprecated lifecycles to their new names, you can run `npx react-codemod rename-unsafe-lifecycles` in your project source folder.\n\nPlease update the following components: %s",
          sortedNames
        ));
      0 < componentWillReceivePropsUniqueNames.size &&
        ((sortedNames = setToSortedString(
          componentWillReceivePropsUniqueNames
        )),
        console.warn(
          "componentWillReceiveProps has been renamed, and is not recommended for use. See https://react.dev/link/unsafe-component-lifecycles for details.\n\n* Move data fetching code or side effects to componentDidUpdate.\n* If you're updating state whenever props change, refactor your code to use memoization techniques or move it to static getDerivedStateFromProps. Learn more at: https://react.dev/link/derived-state\n* Rename componentWillReceiveProps to UNSAFE_componentWillReceiveProps to suppress this warning in non-strict mode. In React 18.x, only the UNSAFE_ name will work. To rename all deprecated lifecycles to their new names, you can run `npx react-codemod rename-unsafe-lifecycles` in your project source folder.\n\nPlease update the following components: %s",
          sortedNames
        ));
      0 < componentWillUpdateUniqueNames.size &&
        ((sortedNames = setToSortedString(componentWillUpdateUniqueNames)),
        console.warn(
          "componentWillUpdate has been renamed, and is not recommended for use. See https://react.dev/link/unsafe-component-lifecycles for details.\n\n* Move data fetching code or side effects to componentDidUpdate.\n* Rename componentWillUpdate to UNSAFE_componentWillUpdate to suppress this warning in non-strict mode. In React 18.x, only the UNSAFE_ name will work. To rename all deprecated lifecycles to their new names, you can run `npx react-codemod rename-unsafe-lifecycles` in your project source folder.\n\nPlease update the following components: %s",
          sortedNames
        ));
    };
    var pendingLegacyContextWarning = new Map(),
      didWarnAboutLegacyContext = new Set();
    ReactStrictModeWarnings.recordLegacyContextWarning = function (
      fiber,
      instance
    ) {
      var strictRoot = null;
      for (var node = fiber; null !== node; )
        node.mode & 8 && (strictRoot = node), (node = node.return);
      null === strictRoot
        ? console.error(
            "Expected to find a StrictMode component in a strict mode tree. This error is likely caused by a bug in React. Please file an issue."
          )
        : !didWarnAboutLegacyContext.has(fiber.type) &&
          ((node = pendingLegacyContextWarning.get(strictRoot)),
          null != fiber.type.contextTypes ||
            null != fiber.type.childContextTypes ||
            (null !== instance &&
              "function" === typeof instance.getChildContext)) &&
          (void 0 === node &&
            ((node = []), pendingLegacyContextWarning.set(strictRoot, node)),
          node.push(fiber));
    };
    ReactStrictModeWarnings.flushLegacyContextWarning = function () {
      pendingLegacyContextWarning.forEach(function (fiberArray) {
        if (0 !== fiberArray.length) {
          var firstFiber = fiberArray[0],
            uniqueNames = new Set();
          fiberArray.forEach(function (fiber) {
            uniqueNames.add(getComponentNameFromFiber(fiber) || "Component");
            didWarnAboutLegacyContext.add(fiber.type);
          });
          var sortedNames = setToSortedString(uniqueNames);
          runWithFiberInDEV(firstFiber, function () {
            console.error(
              "Legacy context API has been detected within a strict-mode tree.\n\nThe old API will be supported in all 16.x releases, but applications using it should migrate to the new version.\n\nPlease update the following components: %s\n\nLearn more about this warning here: https://react.dev/link/legacy-context",
              sortedNames
            );
          });
        }
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
    var callComponent = {
        react_stack_bottom_frame: function (Component, props, secondArg) {
          var wasRendering = isRendering;
          isRendering = !0;
          try {
            return Component(props, secondArg);
          } finally {
            isRendering = wasRendering;
          }
        }
      },
      callComponentInDEV =
        callComponent.react_stack_bottom_frame.bind(callComponent),
      callRender = {
        react_stack_bottom_frame: function (instance) {
          var wasRendering = isRendering;
          isRendering = !0;
          try {
            return instance.render();
          } finally {
            isRendering = wasRendering;
          }
        }
      },
      callRenderInDEV = callRender.react_stack_bottom_frame.bind(callRender),
      callComponentDidMount = {
        react_stack_bottom_frame: function (finishedWork, instance) {
          try {
            instance.componentDidMount();
          } catch (error) {
            captureCommitPhaseError(finishedWork, finishedWork.return, error);
          }
        }
      },
      callComponentDidMountInDEV =
        callComponentDidMount.react_stack_bottom_frame.bind(
          callComponentDidMount
        ),
      callComponentDidUpdate = {
        react_stack_bottom_frame: function (
          finishedWork,
          instance,
          prevProps,
          prevState,
          snapshot
        ) {
          try {
            instance.componentDidUpdate(prevProps, prevState, snapshot);
          } catch (error) {
            captureCommitPhaseError(finishedWork, finishedWork.return, error);
          }
        }
      },
      callComponentDidUpdateInDEV =
        callComponentDidUpdate.react_stack_bottom_frame.bind(
          callComponentDidUpdate
        ),
      callComponentDidCatch = {
        react_stack_bottom_frame: function (instance, errorInfo) {
          var stack = errorInfo.stack;
          instance.componentDidCatch(errorInfo.value, {
            componentStack: null !== stack ? stack : ""
          });
        }
      },
      callComponentDidCatchInDEV =
        callComponentDidCatch.react_stack_bottom_frame.bind(
          callComponentDidCatch
        ),
      callComponentWillUnmount = {
        react_stack_bottom_frame: function (
          current,
          nearestMountedAncestor,
          instance
        ) {
          try {
            instance.componentWillUnmount();
          } catch (error) {
            captureCommitPhaseError(current, nearestMountedAncestor, error);
          }
        }
      },
      callComponentWillUnmountInDEV =
        callComponentWillUnmount.react_stack_bottom_frame.bind(
          callComponentWillUnmount
        ),
      callCreate = {
        react_stack_bottom_frame: function (effect) {
          var create = effect.create;
          effect = effect.inst;
          create = create();
          return (effect.destroy = create);
        }
      },
      callCreateInDEV = callCreate.react_stack_bottom_frame.bind(callCreate),
      callDestroy = {
        react_stack_bottom_frame: function (
          current,
          nearestMountedAncestor,
          destroy
        ) {
          try {
            destroy();
          } catch (error) {
            captureCommitPhaseError(current, nearestMountedAncestor, error);
          }
        }
      },
      callDestroyInDEV = callDestroy.react_stack_bottom_frame.bind(callDestroy),
      callLazyInit = {
        react_stack_bottom_frame: function (lazy) {
          var init = lazy._init;
          return init(lazy._payload);
        }
      },
      callLazyInitInDEV =
        callLazyInit.react_stack_bottom_frame.bind(callLazyInit),
      SuspenseException = Error(
        "Suspense Exception: This is not a real error! It's an implementation detail of `use` to interrupt the current render. You must either rethrow it immediately, or move the `use` call outside of the `try/catch` block. Capturing without rethrowing will lead to unexpected behavior.\n\nTo handle async errors, wrap your component in an error boundary, or call the promise's `.catch` method and pass the result to `use`."
      ),
      SuspenseyCommitException = Error(
        "Suspense Exception: This is not a real error, and should not leak into userspace. If you're seeing this, it's likely a bug in React."
      ),
      SuspenseActionException = Error(
        "Suspense Exception: This is not a real error! It's an implementation detail of `useActionState` to interrupt the current render. You must either rethrow it immediately, or move the `useActionState` call outside of the `try/catch` block. Capturing without rethrowing will lead to unexpected behavior.\n\nTo handle async errors, wrap your component in an error boundary."
      ),
      noopSuspenseyCommitThenable = {
        then: function () {
          console.error(
            'Internal React error: A listener was unexpectedly attached to a "noop" thenable. This is a bug in React. Please file an issue.'
          );
        }
      },
      suspendedThenable = null,
      needsToResetSuspendedThenableDEV = !1,
      thenableState$1 = null,
      thenableIndexCounter$1 = 0,
      currentDebugInfo = null,
      didWarnAboutMaps;
    var didWarnAboutGenerators = (didWarnAboutMaps = !1);
    var ownerHasKeyUseWarning = {};
    var ownerHasFunctionTypeWarning = {};
    var ownerHasSymbolTypeWarning = {};
    warnForMissingKey = function (returnFiber, workInProgress, child) {
      if (
        null !== child &&
        "object" === typeof child &&
        child._store &&
        ((!child._store.validated && null == child.key) ||
          2 === child._store.validated)
      ) {
        if ("object" !== typeof child._store)
          throw Error(
            "React Component in warnForMissingKey should have a _store. This error is likely caused by a bug in React. Please file an issue."
          );
        child._store.validated = 1;
        var componentName = getComponentNameFromFiber(returnFiber),
          componentKey = componentName || "null";
        if (!ownerHasKeyUseWarning[componentKey]) {
          ownerHasKeyUseWarning[componentKey] = !0;
          child = child._owner;
          returnFiber = returnFiber._debugOwner;
          var currentComponentErrorInfo = "";
          returnFiber &&
            "number" === typeof returnFiber.tag &&
            (componentKey = getComponentNameFromFiber(returnFiber)) &&
            (currentComponentErrorInfo =
              "\n\nCheck the render method of `" + componentKey + "`.");
          currentComponentErrorInfo ||
            (componentName &&
              (currentComponentErrorInfo =
                "\n\nCheck the top-level render call using <" +
                componentName +
                ">."));
          var childOwnerAppendix = "";
          null != child &&
            returnFiber !== child &&
            ((componentName = null),
            "number" === typeof child.tag
              ? (componentName = getComponentNameFromFiber(child))
              : "string" === typeof child.name && (componentName = child.name),
            componentName &&
              (childOwnerAppendix =
                " It was passed a child from " + componentName + "."));
          runWithFiberInDEV(workInProgress, function () {
            console.error(
              'Each child in a list should have a unique "key" prop.%s%s See https://react.dev/link/warning-keys for more information.',
              currentComponentErrorInfo,
              childOwnerAppendix
            );
          });
        }
      }
    };
    var reconcileChildFibers = createChildReconciler(!0),
      mountChildFibers = createChildReconciler(!1),
      OffscreenVisible = 1,
      OffscreenPassiveEffectsConnected = 2,
      concurrentQueues = [],
      concurrentQueuesIndex = 0,
      concurrentlyUpdatedLanes = 0,
      UpdateState = 0,
      ReplaceState = 1,
      ForceUpdate = 2,
      CaptureUpdate = 3,
      hasForceUpdate = !1;
    var didWarnUpdateInsideUpdate = !1;
    var currentlyProcessingQueue = null;
    var didReadFromEntangledAsyncAction = !1,
      currentTreeHiddenStackCursor = createCursor(null),
      prevEntangledRenderLanesCursor = createCursor(0),
      suspenseHandlerStackCursor = createCursor(null),
      shellBoundary = null,
      SubtreeSuspenseContextMask = 1,
      ForceSuspenseFallback = 2,
      suspenseStackCursor = createCursor(0),
      NoFlags = 0,
      HasEffect = 1,
      Insertion = 2,
      Layout = 4,
      Passive = 8,
      didWarnUncachedGetSnapshot;
    var didWarnAboutMismatchedHooksForComponent = new Set();
    var didWarnAboutUseWrappedInTryCatch = new Set();
    var didWarnAboutAsyncClientComponent = new Set();
    var didWarnAboutUseFormState = new Set();
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
      globalClientIdCounter = 0,
      RE_RENDER_LIMIT = 25,
      currentHookNameInDev = null,
      hookTypesDev = null,
      hookTypesUpdateIndexDev = -1,
      ignorePreviousDependencies = !1,
      ContextOnlyDispatcher = {
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
    var HooksDispatcherOnMountInDEV = null,
      HooksDispatcherOnMountWithHookTypesInDEV = null,
      HooksDispatcherOnUpdateInDEV = null,
      HooksDispatcherOnRerenderInDEV = null,
      InvalidNestedHooksDispatcherOnMountInDEV = null,
      InvalidNestedHooksDispatcherOnUpdateInDEV = null,
      InvalidNestedHooksDispatcherOnRerenderInDEV = null;
    HooksDispatcherOnMountInDEV = {
      readContext: function (context) {
        return readContext(context);
      },
      use: use,
      useCallback: function (callback, deps) {
        currentHookNameInDev = "useCallback";
        mountHookTypesDev();
        checkDepsAreArrayDev(deps);
        return mountCallback(callback, deps);
      },
      useContext: function (context) {
        currentHookNameInDev = "useContext";
        mountHookTypesDev();
        return readContext(context);
      },
      useEffect: function (create, deps) {
        currentHookNameInDev = "useEffect";
        mountHookTypesDev();
        checkDepsAreArrayDev(deps);
        return mountEffect(create, deps);
      },
      useImperativeHandle: function (ref, create, deps) {
        currentHookNameInDev = "useImperativeHandle";
        mountHookTypesDev();
        checkDepsAreArrayDev(deps);
        return mountImperativeHandle(ref, create, deps);
      },
      useInsertionEffect: function (create, deps) {
        currentHookNameInDev = "useInsertionEffect";
        mountHookTypesDev();
        checkDepsAreArrayDev(deps);
        mountEffectImpl(4, Insertion, create, deps);
      },
      useLayoutEffect: function (create, deps) {
        currentHookNameInDev = "useLayoutEffect";
        mountHookTypesDev();
        checkDepsAreArrayDev(deps);
        return mountLayoutEffect(create, deps);
      },
      useMemo: function (create, deps) {
        currentHookNameInDev = "useMemo";
        mountHookTypesDev();
        checkDepsAreArrayDev(deps);
        var prevDispatcher = ReactSharedInternals.H;
        ReactSharedInternals.H = InvalidNestedHooksDispatcherOnMountInDEV;
        try {
          return mountMemo(create, deps);
        } finally {
          ReactSharedInternals.H = prevDispatcher;
        }
      },
      useReducer: function (reducer, initialArg, init) {
        currentHookNameInDev = "useReducer";
        mountHookTypesDev();
        var prevDispatcher = ReactSharedInternals.H;
        ReactSharedInternals.H = InvalidNestedHooksDispatcherOnMountInDEV;
        try {
          return mountReducer(reducer, initialArg, init);
        } finally {
          ReactSharedInternals.H = prevDispatcher;
        }
      },
      useRef: function (initialValue) {
        currentHookNameInDev = "useRef";
        mountHookTypesDev();
        return mountRef(initialValue);
      },
      useState: function (initialState) {
        currentHookNameInDev = "useState";
        mountHookTypesDev();
        var prevDispatcher = ReactSharedInternals.H;
        ReactSharedInternals.H = InvalidNestedHooksDispatcherOnMountInDEV;
        try {
          return mountState(initialState);
        } finally {
          ReactSharedInternals.H = prevDispatcher;
        }
      },
      useDebugValue: function () {
        currentHookNameInDev = "useDebugValue";
        mountHookTypesDev();
      },
      useDeferredValue: function (value, initialValue) {
        currentHookNameInDev = "useDeferredValue";
        mountHookTypesDev();
        return mountDeferredValue(value, initialValue);
      },
      useTransition: function () {
        currentHookNameInDev = "useTransition";
        mountHookTypesDev();
        return mountTransition();
      },
      useSyncExternalStore: function (
        subscribe,
        getSnapshot,
        getServerSnapshot
      ) {
        currentHookNameInDev = "useSyncExternalStore";
        mountHookTypesDev();
        return mountSyncExternalStore(
          subscribe,
          getSnapshot,
          getServerSnapshot
        );
      },
      useId: function () {
        currentHookNameInDev = "useId";
        mountHookTypesDev();
        return mountId();
      },
      useFormState: function (action, initialState) {
        currentHookNameInDev = "useFormState";
        mountHookTypesDev();
        warnOnUseFormStateInDev();
        return mountActionState(action, initialState);
      },
      useActionState: function (action, initialState) {
        currentHookNameInDev = "useActionState";
        mountHookTypesDev();
        return mountActionState(action, initialState);
      },
      useOptimistic: function (passthrough) {
        currentHookNameInDev = "useOptimistic";
        mountHookTypesDev();
        return mountOptimistic(passthrough);
      },
      useHostTransitionStatus: useHostTransitionStatus,
      useMemoCache: useMemoCache,
      useCacheRefresh: function () {
        currentHookNameInDev = "useCacheRefresh";
        mountHookTypesDev();
        return mountRefresh();
      },
      useEffectEvent: function (callback) {
        currentHookNameInDev = "useEffectEvent";
        mountHookTypesDev();
        return mountEvent(callback);
      }
    };
    HooksDispatcherOnMountWithHookTypesInDEV = {
      readContext: function (context) {
        return readContext(context);
      },
      use: use,
      useCallback: function (callback, deps) {
        currentHookNameInDev = "useCallback";
        updateHookTypesDev();
        return mountCallback(callback, deps);
      },
      useContext: function (context) {
        currentHookNameInDev = "useContext";
        updateHookTypesDev();
        return readContext(context);
      },
      useEffect: function (create, deps) {
        currentHookNameInDev = "useEffect";
        updateHookTypesDev();
        return mountEffect(create, deps);
      },
      useImperativeHandle: function (ref, create, deps) {
        currentHookNameInDev = "useImperativeHandle";
        updateHookTypesDev();
        return mountImperativeHandle(ref, create, deps);
      },
      useInsertionEffect: function (create, deps) {
        currentHookNameInDev = "useInsertionEffect";
        updateHookTypesDev();
        mountEffectImpl(4, Insertion, create, deps);
      },
      useLayoutEffect: function (create, deps) {
        currentHookNameInDev = "useLayoutEffect";
        updateHookTypesDev();
        return mountLayoutEffect(create, deps);
      },
      useMemo: function (create, deps) {
        currentHookNameInDev = "useMemo";
        updateHookTypesDev();
        var prevDispatcher = ReactSharedInternals.H;
        ReactSharedInternals.H = InvalidNestedHooksDispatcherOnMountInDEV;
        try {
          return mountMemo(create, deps);
        } finally {
          ReactSharedInternals.H = prevDispatcher;
        }
      },
      useReducer: function (reducer, initialArg, init) {
        currentHookNameInDev = "useReducer";
        updateHookTypesDev();
        var prevDispatcher = ReactSharedInternals.H;
        ReactSharedInternals.H = InvalidNestedHooksDispatcherOnMountInDEV;
        try {
          return mountReducer(reducer, initialArg, init);
        } finally {
          ReactSharedInternals.H = prevDispatcher;
        }
      },
      useRef: function (initialValue) {
        currentHookNameInDev = "useRef";
        updateHookTypesDev();
        return mountRef(initialValue);
      },
      useState: function (initialState) {
        currentHookNameInDev = "useState";
        updateHookTypesDev();
        var prevDispatcher = ReactSharedInternals.H;
        ReactSharedInternals.H = InvalidNestedHooksDispatcherOnMountInDEV;
        try {
          return mountState(initialState);
        } finally {
          ReactSharedInternals.H = prevDispatcher;
        }
      },
      useDebugValue: function () {
        currentHookNameInDev = "useDebugValue";
        updateHookTypesDev();
      },
      useDeferredValue: function (value, initialValue) {
        currentHookNameInDev = "useDeferredValue";
        updateHookTypesDev();
        return mountDeferredValue(value, initialValue);
      },
      useTransition: function () {
        currentHookNameInDev = "useTransition";
        updateHookTypesDev();
        return mountTransition();
      },
      useSyncExternalStore: function (
        subscribe,
        getSnapshot,
        getServerSnapshot
      ) {
        currentHookNameInDev = "useSyncExternalStore";
        updateHookTypesDev();
        return mountSyncExternalStore(
          subscribe,
          getSnapshot,
          getServerSnapshot
        );
      },
      useId: function () {
        currentHookNameInDev = "useId";
        updateHookTypesDev();
        return mountId();
      },
      useActionState: function (action, initialState) {
        currentHookNameInDev = "useActionState";
        updateHookTypesDev();
        return mountActionState(action, initialState);
      },
      useFormState: function (action, initialState) {
        currentHookNameInDev = "useFormState";
        updateHookTypesDev();
        warnOnUseFormStateInDev();
        return mountActionState(action, initialState);
      },
      useOptimistic: function (passthrough) {
        currentHookNameInDev = "useOptimistic";
        updateHookTypesDev();
        return mountOptimistic(passthrough);
      },
      useHostTransitionStatus: useHostTransitionStatus,
      useMemoCache: useMemoCache,
      useCacheRefresh: function () {
        currentHookNameInDev = "useCacheRefresh";
        updateHookTypesDev();
        return mountRefresh();
      },
      useEffectEvent: function (callback) {
        currentHookNameInDev = "useEffectEvent";
        updateHookTypesDev();
        return mountEvent(callback);
      }
    };
    HooksDispatcherOnUpdateInDEV = {
      readContext: function (context) {
        return readContext(context);
      },
      use: use,
      useCallback: function (callback, deps) {
        currentHookNameInDev = "useCallback";
        updateHookTypesDev();
        return updateCallback(callback, deps);
      },
      useContext: function (context) {
        currentHookNameInDev = "useContext";
        updateHookTypesDev();
        return readContext(context);
      },
      useEffect: function (create, deps) {
        currentHookNameInDev = "useEffect";
        updateHookTypesDev();
        updateEffectImpl(2048, Passive, create, deps);
      },
      useImperativeHandle: function (ref, create, deps) {
        currentHookNameInDev = "useImperativeHandle";
        updateHookTypesDev();
        return updateImperativeHandle(ref, create, deps);
      },
      useInsertionEffect: function (create, deps) {
        currentHookNameInDev = "useInsertionEffect";
        updateHookTypesDev();
        return updateEffectImpl(4, Insertion, create, deps);
      },
      useLayoutEffect: function (create, deps) {
        currentHookNameInDev = "useLayoutEffect";
        updateHookTypesDev();
        return updateEffectImpl(4, Layout, create, deps);
      },
      useMemo: function (create, deps) {
        currentHookNameInDev = "useMemo";
        updateHookTypesDev();
        var prevDispatcher = ReactSharedInternals.H;
        ReactSharedInternals.H = InvalidNestedHooksDispatcherOnUpdateInDEV;
        try {
          return updateMemo(create, deps);
        } finally {
          ReactSharedInternals.H = prevDispatcher;
        }
      },
      useReducer: function (reducer, initialArg, init) {
        currentHookNameInDev = "useReducer";
        updateHookTypesDev();
        var prevDispatcher = ReactSharedInternals.H;
        ReactSharedInternals.H = InvalidNestedHooksDispatcherOnUpdateInDEV;
        try {
          return updateReducer(reducer, initialArg, init);
        } finally {
          ReactSharedInternals.H = prevDispatcher;
        }
      },
      useRef: function () {
        currentHookNameInDev = "useRef";
        updateHookTypesDev();
        return updateWorkInProgressHook().memoizedState;
      },
      useState: function () {
        currentHookNameInDev = "useState";
        updateHookTypesDev();
        var prevDispatcher = ReactSharedInternals.H;
        ReactSharedInternals.H = InvalidNestedHooksDispatcherOnUpdateInDEV;
        try {
          return updateReducer(basicStateReducer);
        } finally {
          ReactSharedInternals.H = prevDispatcher;
        }
      },
      useDebugValue: function () {
        currentHookNameInDev = "useDebugValue";
        updateHookTypesDev();
      },
      useDeferredValue: function (value, initialValue) {
        currentHookNameInDev = "useDeferredValue";
        updateHookTypesDev();
        return updateDeferredValue(value, initialValue);
      },
      useTransition: function () {
        currentHookNameInDev = "useTransition";
        updateHookTypesDev();
        return updateTransition();
      },
      useSyncExternalStore: function (
        subscribe,
        getSnapshot,
        getServerSnapshot
      ) {
        currentHookNameInDev = "useSyncExternalStore";
        updateHookTypesDev();
        return updateSyncExternalStore(
          subscribe,
          getSnapshot,
          getServerSnapshot
        );
      },
      useId: function () {
        currentHookNameInDev = "useId";
        updateHookTypesDev();
        return updateWorkInProgressHook().memoizedState;
      },
      useFormState: function (action) {
        currentHookNameInDev = "useFormState";
        updateHookTypesDev();
        warnOnUseFormStateInDev();
        return updateActionState(action);
      },
      useActionState: function (action) {
        currentHookNameInDev = "useActionState";
        updateHookTypesDev();
        return updateActionState(action);
      },
      useOptimistic: function (passthrough, reducer) {
        currentHookNameInDev = "useOptimistic";
        updateHookTypesDev();
        return updateOptimistic(passthrough, reducer);
      },
      useHostTransitionStatus: useHostTransitionStatus,
      useMemoCache: useMemoCache,
      useCacheRefresh: function () {
        currentHookNameInDev = "useCacheRefresh";
        updateHookTypesDev();
        return updateWorkInProgressHook().memoizedState;
      },
      useEffectEvent: function (callback) {
        currentHookNameInDev = "useEffectEvent";
        updateHookTypesDev();
        return updateEvent(callback);
      }
    };
    HooksDispatcherOnRerenderInDEV = {
      readContext: function (context) {
        return readContext(context);
      },
      use: use,
      useCallback: function (callback, deps) {
        currentHookNameInDev = "useCallback";
        updateHookTypesDev();
        return updateCallback(callback, deps);
      },
      useContext: function (context) {
        currentHookNameInDev = "useContext";
        updateHookTypesDev();
        return readContext(context);
      },
      useEffect: function (create, deps) {
        currentHookNameInDev = "useEffect";
        updateHookTypesDev();
        updateEffectImpl(2048, Passive, create, deps);
      },
      useImperativeHandle: function (ref, create, deps) {
        currentHookNameInDev = "useImperativeHandle";
        updateHookTypesDev();
        return updateImperativeHandle(ref, create, deps);
      },
      useInsertionEffect: function (create, deps) {
        currentHookNameInDev = "useInsertionEffect";
        updateHookTypesDev();
        return updateEffectImpl(4, Insertion, create, deps);
      },
      useLayoutEffect: function (create, deps) {
        currentHookNameInDev = "useLayoutEffect";
        updateHookTypesDev();
        return updateEffectImpl(4, Layout, create, deps);
      },
      useMemo: function (create, deps) {
        currentHookNameInDev = "useMemo";
        updateHookTypesDev();
        var prevDispatcher = ReactSharedInternals.H;
        ReactSharedInternals.H = InvalidNestedHooksDispatcherOnRerenderInDEV;
        try {
          return updateMemo(create, deps);
        } finally {
          ReactSharedInternals.H = prevDispatcher;
        }
      },
      useReducer: function (reducer, initialArg, init) {
        currentHookNameInDev = "useReducer";
        updateHookTypesDev();
        var prevDispatcher = ReactSharedInternals.H;
        ReactSharedInternals.H = InvalidNestedHooksDispatcherOnRerenderInDEV;
        try {
          return rerenderReducer(reducer, initialArg, init);
        } finally {
          ReactSharedInternals.H = prevDispatcher;
        }
      },
      useRef: function () {
        currentHookNameInDev = "useRef";
        updateHookTypesDev();
        return updateWorkInProgressHook().memoizedState;
      },
      useState: function () {
        currentHookNameInDev = "useState";
        updateHookTypesDev();
        var prevDispatcher = ReactSharedInternals.H;
        ReactSharedInternals.H = InvalidNestedHooksDispatcherOnRerenderInDEV;
        try {
          return rerenderReducer(basicStateReducer);
        } finally {
          ReactSharedInternals.H = prevDispatcher;
        }
      },
      useDebugValue: function () {
        currentHookNameInDev = "useDebugValue";
        updateHookTypesDev();
      },
      useDeferredValue: function (value, initialValue) {
        currentHookNameInDev = "useDeferredValue";
        updateHookTypesDev();
        return rerenderDeferredValue(value, initialValue);
      },
      useTransition: function () {
        currentHookNameInDev = "useTransition";
        updateHookTypesDev();
        return rerenderTransition();
      },
      useSyncExternalStore: function (
        subscribe,
        getSnapshot,
        getServerSnapshot
      ) {
        currentHookNameInDev = "useSyncExternalStore";
        updateHookTypesDev();
        return updateSyncExternalStore(
          subscribe,
          getSnapshot,
          getServerSnapshot
        );
      },
      useId: function () {
        currentHookNameInDev = "useId";
        updateHookTypesDev();
        return updateWorkInProgressHook().memoizedState;
      },
      useFormState: function (action) {
        currentHookNameInDev = "useFormState";
        updateHookTypesDev();
        warnOnUseFormStateInDev();
        return rerenderActionState(action);
      },
      useActionState: function (action) {
        currentHookNameInDev = "useActionState";
        updateHookTypesDev();
        return rerenderActionState(action);
      },
      useOptimistic: function (passthrough, reducer) {
        currentHookNameInDev = "useOptimistic";
        updateHookTypesDev();
        return rerenderOptimistic(passthrough, reducer);
      },
      useHostTransitionStatus: useHostTransitionStatus,
      useMemoCache: useMemoCache,
      useCacheRefresh: function () {
        currentHookNameInDev = "useCacheRefresh";
        updateHookTypesDev();
        return updateWorkInProgressHook().memoizedState;
      },
      useEffectEvent: function (callback) {
        currentHookNameInDev = "useEffectEvent";
        updateHookTypesDev();
        return updateEvent(callback);
      }
    };
    InvalidNestedHooksDispatcherOnMountInDEV = {
      readContext: function (context) {
        warnInvalidContextAccess();
        return readContext(context);
      },
      use: function (usable) {
        warnInvalidHookAccess();
        return use(usable);
      },
      useCallback: function (callback, deps) {
        currentHookNameInDev = "useCallback";
        warnInvalidHookAccess();
        mountHookTypesDev();
        return mountCallback(callback, deps);
      },
      useContext: function (context) {
        currentHookNameInDev = "useContext";
        warnInvalidHookAccess();
        mountHookTypesDev();
        return readContext(context);
      },
      useEffect: function (create, deps) {
        currentHookNameInDev = "useEffect";
        warnInvalidHookAccess();
        mountHookTypesDev();
        return mountEffect(create, deps);
      },
      useImperativeHandle: function (ref, create, deps) {
        currentHookNameInDev = "useImperativeHandle";
        warnInvalidHookAccess();
        mountHookTypesDev();
        return mountImperativeHandle(ref, create, deps);
      },
      useInsertionEffect: function (create, deps) {
        currentHookNameInDev = "useInsertionEffect";
        warnInvalidHookAccess();
        mountHookTypesDev();
        mountEffectImpl(4, Insertion, create, deps);
      },
      useLayoutEffect: function (create, deps) {
        currentHookNameInDev = "useLayoutEffect";
        warnInvalidHookAccess();
        mountHookTypesDev();
        return mountLayoutEffect(create, deps);
      },
      useMemo: function (create, deps) {
        currentHookNameInDev = "useMemo";
        warnInvalidHookAccess();
        mountHookTypesDev();
        var prevDispatcher = ReactSharedInternals.H;
        ReactSharedInternals.H = InvalidNestedHooksDispatcherOnMountInDEV;
        try {
          return mountMemo(create, deps);
        } finally {
          ReactSharedInternals.H = prevDispatcher;
        }
      },
      useReducer: function (reducer, initialArg, init) {
        currentHookNameInDev = "useReducer";
        warnInvalidHookAccess();
        mountHookTypesDev();
        var prevDispatcher = ReactSharedInternals.H;
        ReactSharedInternals.H = InvalidNestedHooksDispatcherOnMountInDEV;
        try {
          return mountReducer(reducer, initialArg, init);
        } finally {
          ReactSharedInternals.H = prevDispatcher;
        }
      },
      useRef: function (initialValue) {
        currentHookNameInDev = "useRef";
        warnInvalidHookAccess();
        mountHookTypesDev();
        return mountRef(initialValue);
      },
      useState: function (initialState) {
        currentHookNameInDev = "useState";
        warnInvalidHookAccess();
        mountHookTypesDev();
        var prevDispatcher = ReactSharedInternals.H;
        ReactSharedInternals.H = InvalidNestedHooksDispatcherOnMountInDEV;
        try {
          return mountState(initialState);
        } finally {
          ReactSharedInternals.H = prevDispatcher;
        }
      },
      useDebugValue: function () {
        currentHookNameInDev = "useDebugValue";
        warnInvalidHookAccess();
        mountHookTypesDev();
      },
      useDeferredValue: function (value, initialValue) {
        currentHookNameInDev = "useDeferredValue";
        warnInvalidHookAccess();
        mountHookTypesDev();
        return mountDeferredValue(value, initialValue);
      },
      useTransition: function () {
        currentHookNameInDev = "useTransition";
        warnInvalidHookAccess();
        mountHookTypesDev();
        return mountTransition();
      },
      useSyncExternalStore: function (
        subscribe,
        getSnapshot,
        getServerSnapshot
      ) {
        currentHookNameInDev = "useSyncExternalStore";
        warnInvalidHookAccess();
        mountHookTypesDev();
        return mountSyncExternalStore(
          subscribe,
          getSnapshot,
          getServerSnapshot
        );
      },
      useId: function () {
        currentHookNameInDev = "useId";
        warnInvalidHookAccess();
        mountHookTypesDev();
        return mountId();
      },
      useFormState: function (action, initialState) {
        currentHookNameInDev = "useFormState";
        warnInvalidHookAccess();
        mountHookTypesDev();
        return mountActionState(action, initialState);
      },
      useActionState: function (action, initialState) {
        currentHookNameInDev = "useActionState";
        warnInvalidHookAccess();
        mountHookTypesDev();
        return mountActionState(action, initialState);
      },
      useOptimistic: function (passthrough) {
        currentHookNameInDev = "useOptimistic";
        warnInvalidHookAccess();
        mountHookTypesDev();
        return mountOptimistic(passthrough);
      },
      useMemoCache: function (size) {
        warnInvalidHookAccess();
        return useMemoCache(size);
      },
      useHostTransitionStatus: useHostTransitionStatus,
      useCacheRefresh: function () {
        currentHookNameInDev = "useCacheRefresh";
        mountHookTypesDev();
        return mountRefresh();
      },
      useEffectEvent: function (callback) {
        currentHookNameInDev = "useEffectEvent";
        warnInvalidHookAccess();
        mountHookTypesDev();
        return mountEvent(callback);
      }
    };
    InvalidNestedHooksDispatcherOnUpdateInDEV = {
      readContext: function (context) {
        warnInvalidContextAccess();
        return readContext(context);
      },
      use: function (usable) {
        warnInvalidHookAccess();
        return use(usable);
      },
      useCallback: function (callback, deps) {
        currentHookNameInDev = "useCallback";
        warnInvalidHookAccess();
        updateHookTypesDev();
        return updateCallback(callback, deps);
      },
      useContext: function (context) {
        currentHookNameInDev = "useContext";
        warnInvalidHookAccess();
        updateHookTypesDev();
        return readContext(context);
      },
      useEffect: function (create, deps) {
        currentHookNameInDev = "useEffect";
        warnInvalidHookAccess();
        updateHookTypesDev();
        updateEffectImpl(2048, Passive, create, deps);
      },
      useImperativeHandle: function (ref, create, deps) {
        currentHookNameInDev = "useImperativeHandle";
        warnInvalidHookAccess();
        updateHookTypesDev();
        return updateImperativeHandle(ref, create, deps);
      },
      useInsertionEffect: function (create, deps) {
        currentHookNameInDev = "useInsertionEffect";
        warnInvalidHookAccess();
        updateHookTypesDev();
        return updateEffectImpl(4, Insertion, create, deps);
      },
      useLayoutEffect: function (create, deps) {
        currentHookNameInDev = "useLayoutEffect";
        warnInvalidHookAccess();
        updateHookTypesDev();
        return updateEffectImpl(4, Layout, create, deps);
      },
      useMemo: function (create, deps) {
        currentHookNameInDev = "useMemo";
        warnInvalidHookAccess();
        updateHookTypesDev();
        var prevDispatcher = ReactSharedInternals.H;
        ReactSharedInternals.H = InvalidNestedHooksDispatcherOnUpdateInDEV;
        try {
          return updateMemo(create, deps);
        } finally {
          ReactSharedInternals.H = prevDispatcher;
        }
      },
      useReducer: function (reducer, initialArg, init) {
        currentHookNameInDev = "useReducer";
        warnInvalidHookAccess();
        updateHookTypesDev();
        var prevDispatcher = ReactSharedInternals.H;
        ReactSharedInternals.H = InvalidNestedHooksDispatcherOnUpdateInDEV;
        try {
          return updateReducer(reducer, initialArg, init);
        } finally {
          ReactSharedInternals.H = prevDispatcher;
        }
      },
      useRef: function () {
        currentHookNameInDev = "useRef";
        warnInvalidHookAccess();
        updateHookTypesDev();
        return updateWorkInProgressHook().memoizedState;
      },
      useState: function () {
        currentHookNameInDev = "useState";
        warnInvalidHookAccess();
        updateHookTypesDev();
        var prevDispatcher = ReactSharedInternals.H;
        ReactSharedInternals.H = InvalidNestedHooksDispatcherOnUpdateInDEV;
        try {
          return updateReducer(basicStateReducer);
        } finally {
          ReactSharedInternals.H = prevDispatcher;
        }
      },
      useDebugValue: function () {
        currentHookNameInDev = "useDebugValue";
        warnInvalidHookAccess();
        updateHookTypesDev();
      },
      useDeferredValue: function (value, initialValue) {
        currentHookNameInDev = "useDeferredValue";
        warnInvalidHookAccess();
        updateHookTypesDev();
        return updateDeferredValue(value, initialValue);
      },
      useTransition: function () {
        currentHookNameInDev = "useTransition";
        warnInvalidHookAccess();
        updateHookTypesDev();
        return updateTransition();
      },
      useSyncExternalStore: function (
        subscribe,
        getSnapshot,
        getServerSnapshot
      ) {
        currentHookNameInDev = "useSyncExternalStore";
        warnInvalidHookAccess();
        updateHookTypesDev();
        return updateSyncExternalStore(
          subscribe,
          getSnapshot,
          getServerSnapshot
        );
      },
      useId: function () {
        currentHookNameInDev = "useId";
        warnInvalidHookAccess();
        updateHookTypesDev();
        return updateWorkInProgressHook().memoizedState;
      },
      useFormState: function (action) {
        currentHookNameInDev = "useFormState";
        warnInvalidHookAccess();
        updateHookTypesDev();
        return updateActionState(action);
      },
      useActionState: function (action) {
        currentHookNameInDev = "useActionState";
        warnInvalidHookAccess();
        updateHookTypesDev();
        return updateActionState(action);
      },
      useOptimistic: function (passthrough, reducer) {
        currentHookNameInDev = "useOptimistic";
        warnInvalidHookAccess();
        updateHookTypesDev();
        return updateOptimistic(passthrough, reducer);
      },
      useMemoCache: function (size) {
        warnInvalidHookAccess();
        return useMemoCache(size);
      },
      useHostTransitionStatus: useHostTransitionStatus,
      useCacheRefresh: function () {
        currentHookNameInDev = "useCacheRefresh";
        updateHookTypesDev();
        return updateWorkInProgressHook().memoizedState;
      },
      useEffectEvent: function (callback) {
        currentHookNameInDev = "useEffectEvent";
        warnInvalidHookAccess();
        updateHookTypesDev();
        return updateEvent(callback);
      }
    };
    InvalidNestedHooksDispatcherOnRerenderInDEV = {
      readContext: function (context) {
        warnInvalidContextAccess();
        return readContext(context);
      },
      use: function (usable) {
        warnInvalidHookAccess();
        return use(usable);
      },
      useCallback: function (callback, deps) {
        currentHookNameInDev = "useCallback";
        warnInvalidHookAccess();
        updateHookTypesDev();
        return updateCallback(callback, deps);
      },
      useContext: function (context) {
        currentHookNameInDev = "useContext";
        warnInvalidHookAccess();
        updateHookTypesDev();
        return readContext(context);
      },
      useEffect: function (create, deps) {
        currentHookNameInDev = "useEffect";
        warnInvalidHookAccess();
        updateHookTypesDev();
        updateEffectImpl(2048, Passive, create, deps);
      },
      useImperativeHandle: function (ref, create, deps) {
        currentHookNameInDev = "useImperativeHandle";
        warnInvalidHookAccess();
        updateHookTypesDev();
        return updateImperativeHandle(ref, create, deps);
      },
      useInsertionEffect: function (create, deps) {
        currentHookNameInDev = "useInsertionEffect";
        warnInvalidHookAccess();
        updateHookTypesDev();
        return updateEffectImpl(4, Insertion, create, deps);
      },
      useLayoutEffect: function (create, deps) {
        currentHookNameInDev = "useLayoutEffect";
        warnInvalidHookAccess();
        updateHookTypesDev();
        return updateEffectImpl(4, Layout, create, deps);
      },
      useMemo: function (create, deps) {
        currentHookNameInDev = "useMemo";
        warnInvalidHookAccess();
        updateHookTypesDev();
        var prevDispatcher = ReactSharedInternals.H;
        ReactSharedInternals.H = InvalidNestedHooksDispatcherOnUpdateInDEV;
        try {
          return updateMemo(create, deps);
        } finally {
          ReactSharedInternals.H = prevDispatcher;
        }
      },
      useReducer: function (reducer, initialArg, init) {
        currentHookNameInDev = "useReducer";
        warnInvalidHookAccess();
        updateHookTypesDev();
        var prevDispatcher = ReactSharedInternals.H;
        ReactSharedInternals.H = InvalidNestedHooksDispatcherOnUpdateInDEV;
        try {
          return rerenderReducer(reducer, initialArg, init);
        } finally {
          ReactSharedInternals.H = prevDispatcher;
        }
      },
      useRef: function () {
        currentHookNameInDev = "useRef";
        warnInvalidHookAccess();
        updateHookTypesDev();
        return updateWorkInProgressHook().memoizedState;
      },
      useState: function () {
        currentHookNameInDev = "useState";
        warnInvalidHookAccess();
        updateHookTypesDev();
        var prevDispatcher = ReactSharedInternals.H;
        ReactSharedInternals.H = InvalidNestedHooksDispatcherOnUpdateInDEV;
        try {
          return rerenderReducer(basicStateReducer);
        } finally {
          ReactSharedInternals.H = prevDispatcher;
        }
      },
      useDebugValue: function () {
        currentHookNameInDev = "useDebugValue";
        warnInvalidHookAccess();
        updateHookTypesDev();
      },
      useDeferredValue: function (value, initialValue) {
        currentHookNameInDev = "useDeferredValue";
        warnInvalidHookAccess();
        updateHookTypesDev();
        return rerenderDeferredValue(value, initialValue);
      },
      useTransition: function () {
        currentHookNameInDev = "useTransition";
        warnInvalidHookAccess();
        updateHookTypesDev();
        return rerenderTransition();
      },
      useSyncExternalStore: function (
        subscribe,
        getSnapshot,
        getServerSnapshot
      ) {
        currentHookNameInDev = "useSyncExternalStore";
        warnInvalidHookAccess();
        updateHookTypesDev();
        return updateSyncExternalStore(
          subscribe,
          getSnapshot,
          getServerSnapshot
        );
      },
      useId: function () {
        currentHookNameInDev = "useId";
        warnInvalidHookAccess();
        updateHookTypesDev();
        return updateWorkInProgressHook().memoizedState;
      },
      useFormState: function (action) {
        currentHookNameInDev = "useFormState";
        warnInvalidHookAccess();
        updateHookTypesDev();
        return rerenderActionState(action);
      },
      useActionState: function (action) {
        currentHookNameInDev = "useActionState";
        warnInvalidHookAccess();
        updateHookTypesDev();
        return rerenderActionState(action);
      },
      useOptimistic: function (passthrough, reducer) {
        currentHookNameInDev = "useOptimistic";
        warnInvalidHookAccess();
        updateHookTypesDev();
        return rerenderOptimistic(passthrough, reducer);
      },
      useMemoCache: function (size) {
        warnInvalidHookAccess();
        return useMemoCache(size);
      },
      useHostTransitionStatus: useHostTransitionStatus,
      useCacheRefresh: function () {
        currentHookNameInDev = "useCacheRefresh";
        updateHookTypesDev();
        return updateWorkInProgressHook().memoizedState;
      },
      useEffectEvent: function (callback) {
        currentHookNameInDev = "useEffectEvent";
        warnInvalidHookAccess();
        updateHookTypesDev();
        return updateEvent(callback);
      }
    };
    var fakeInternalInstance = {};
    var didWarnAboutStateAssignmentForComponent = new Set();
    var didWarnAboutUninitializedState = new Set();
    var didWarnAboutGetSnapshotBeforeUpdateWithoutDidUpdate = new Set();
    var didWarnAboutLegacyLifecyclesAndDerivedState = new Set();
    var didWarnAboutDirectlyAssigningPropsToState = new Set();
    var didWarnAboutUndefinedDerivedState = new Set();
    var didWarnAboutContextTypes$1 = new Set();
    var didWarnAboutChildContextTypes = new Set();
    var didWarnAboutInvalidateContextType = new Set();
    var didWarnOnInvalidCallback = new Set();
    Object.freeze(fakeInternalInstance);
    var classComponentUpdater = {
        enqueueSetState: function (inst, payload, callback) {
          inst = inst._reactInternals;
          var lane = requestUpdateLane(inst),
            update = createUpdate(lane);
          update.payload = payload;
          void 0 !== callback &&
            null !== callback &&
            (warnOnInvalidCallback(callback), (update.callback = callback));
          payload = enqueueUpdate(inst, update, lane);
          null !== payload &&
            (startUpdateTimerByLane(lane, "this.setState()", inst),
            scheduleUpdateOnFiber(payload, inst, lane),
            entangleTransitions(payload, inst, lane));
          enableSchedulingProfiler && markStateUpdateScheduled(inst, lane);
        },
        enqueueReplaceState: function (inst, payload, callback) {
          inst = inst._reactInternals;
          var lane = requestUpdateLane(inst),
            update = createUpdate(lane);
          update.tag = ReplaceState;
          update.payload = payload;
          void 0 !== callback &&
            null !== callback &&
            (warnOnInvalidCallback(callback), (update.callback = callback));
          payload = enqueueUpdate(inst, update, lane);
          null !== payload &&
            (startUpdateTimerByLane(lane, "this.replaceState()", inst),
            scheduleUpdateOnFiber(payload, inst, lane),
            entangleTransitions(payload, inst, lane));
          enableSchedulingProfiler && markStateUpdateScheduled(inst, lane);
        },
        enqueueForceUpdate: function (inst, callback) {
          inst = inst._reactInternals;
          var lane = requestUpdateLane(inst),
            update = createUpdate(lane);
          update.tag = ForceUpdate;
          void 0 !== callback &&
            null !== callback &&
            (warnOnInvalidCallback(callback), (update.callback = callback));
          callback = enqueueUpdate(inst, update, lane);
          null !== callback &&
            (startUpdateTimerByLane(lane, "this.forceUpdate()", inst),
            scheduleUpdateOnFiber(callback, inst, lane),
            entangleTransitions(callback, inst, lane));
          enableSchedulingProfiler &&
            enableSchedulingProfiler &&
            null !== injectedProfilingHooks &&
            "function" ===
              typeof injectedProfilingHooks.markForceUpdateScheduled &&
            injectedProfilingHooks.markForceUpdateScheduled(inst, lane);
        }
      },
      componentName = null,
      errorBoundaryName = null,
      TransitionRoot = 0,
      TransitionTracingMarker = 1,
      markerInstanceStack = createCursor(null),
      SelectiveHydrationException = Error(
        "This is not a real error. It's an implementation detail of React's selective hydration feature. If this leaks into userspace, it's a bug in React. Please file an issue."
      ),
      didReceiveUpdate = !1;
    var didWarnAboutBadClass = {};
    var didWarnAboutContextTypeOnFunctionComponent = {};
    var didWarnAboutContextTypes = {};
    var didWarnAboutGetDerivedStateOnFunctionComponent = {};
    var didWarnAboutReassigningProps = !1;
    var didWarnAboutRevealOrder = {};
    var didWarnAboutTailOptions = {};
    var didWarnAboutClassNameOnViewTransition = {};
    var SUSPENDED_MARKER = {
        dehydrated: null,
        treeContext: null,
        retryLane: 0,
        hydrationErrors: null
      },
      hasWarnedAboutUsingNoValuePropOnContextProvider = !1,
      emptyObject = {},
      didWarnAboutUndefinedSnapshotBeforeUpdate = null;
    didWarnAboutUndefinedSnapshotBeforeUpdate = new Set();
    var rootMutationContext = !1,
      viewTransitionMutationContext = !1,
      shouldStartViewTransition = !1,
      appearingViewTransitions = null,
      viewTransitionCancelableChildren = null,
      viewTransitionHostInstanceIdx = 0,
      mountedNamedViewTransitions = new Map(),
      didWarnAboutName = {},
      offscreenSubtreeIsHidden = !1,
      offscreenSubtreeWasHidden = !1,
      offscreenDirectParentIsHidden = !1,
      needsFormReset = !1,
      PossiblyWeakSet = "function" === typeof WeakSet ? WeakSet : Set,
      nextEffect = null,
      inProgressLanes = null,
      inProgressRoot = null,
      focusedInstanceHandle = null,
      shouldFireAfterActiveInstanceBlur = !1,
      viewTransitionContextChanged = !1,
      inUpdateViewTransition = !1,
      rootViewTransitionAffected = !1,
      rootViewTransitionNameCanceled = !1,
      hostParent = null,
      hostParentIsContainer = !1,
      currentHoistableRoot = null,
      inHydratedSubtree = !1,
      suspenseyCommitFlag = 8192,
      DefaultAsyncDispatcher = {
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
        },
        getOwner: function () {
          return current;
        }
      },
      COMPONENT_TYPE = 0,
      HAS_PSEUDO_CLASS_TYPE = 1,
      ROLE_TYPE = 2,
      TEST_NAME_TYPE = 3,
      TEXT_TYPE = 4;
    if ("function" === typeof Symbol && Symbol.for) {
      var symbolFor = Symbol.for;
      COMPONENT_TYPE = symbolFor("selector.component");
      HAS_PSEUDO_CLASS_TYPE = symbolFor("selector.has_pseudo_class");
      ROLE_TYPE = symbolFor("selector.role");
      TEST_NAME_TYPE = symbolFor("selector.test_id");
      TEXT_TYPE = symbolFor("selector.text");
    }
    var commitHooks = [],
      postPaintCallbackScheduled = !1,
      callbacks = [],
      PossiblyWeakMap = "function" === typeof WeakMap ? WeakMap : Map,
      NoContext = 0,
      RenderContext = 2,
      CommitContext = 4,
      RootInProgress = 0,
      RootFatalErrored = 1,
      RootErrored = 2,
      RootSuspended = 3,
      RootSuspendedWithDelay = 4,
      RootSuspendedAtTheShell = 6,
      RootCompleted = 5,
      executionContext = NoContext,
      workInProgressRoot = null,
      workInProgress = null,
      workInProgressRootRenderLanes = 0,
      NotSuspended = 0,
      SuspendedOnError = 1,
      SuspendedOnData = 2,
      SuspendedOnImmediate = 3,
      SuspendedOnInstance = 4,
      SuspendedOnInstanceAndReadyToContinue = 5,
      SuspendedOnDeprecatedThrowPromise = 6,
      SuspendedAndReadyToContinue = 7,
      SuspendedOnHydration = 8,
      SuspendedOnAction = 9,
      workInProgressSuspendedReason = NotSuspended,
      workInProgressThrownValue = null,
      workInProgressRootDidSkipSuspendedSiblings = !1,
      workInProgressRootIsPrerendering = !1,
      workInProgressRootDidAttachPingListener = !1,
      entangledRenderLanes = 0,
      workInProgressRootExitStatus = RootInProgress,
      workInProgressRootSkippedLanes = 0,
      workInProgressRootInterleavedUpdatedLanes = 0,
      workInProgressRootPingedLanes = 0,
      workInProgressDeferredLane = 0,
      workInProgressSuspendedRetryLanes = 0,
      workInProgressRootConcurrentErrors = null,
      workInProgressRootRecoverableErrors = null,
      workInProgressRootDidIncludeRecursiveRenderUpdate = !1,
      didIncludeCommitPhaseUpdate = !1,
      globalMostRecentFallbackTime = 0,
      globalMostRecentTransitionTime = 0,
      FALLBACK_THROTTLE_MS = 300,
      workInProgressRootRenderTargetTime = Infinity,
      RENDER_TIMEOUT_MS = 500,
      workInProgressTransitions = null,
      workInProgressUpdateTask = null,
      currentPendingTransitionCallbacks = null,
      currentEndTime = null,
      legacyErrorBoundariesThatAlreadyFailed = null,
      IMMEDIATE_COMMIT = 0,
      ABORTED_VIEW_TRANSITION_COMMIT = 1,
      DELAYED_PASSIVE_COMMIT = 2,
      ANIMATION_STARTED_COMMIT = 3,
      NO_PENDING_EFFECTS = 0,
      PENDING_MUTATION_PHASE = 1,
      PENDING_LAYOUT_PHASE = 2,
      PENDING_AFTER_MUTATION_PHASE = 3,
      PENDING_SPAWNED_WORK = 4,
      PENDING_PASSIVE_PHASE = 5,
      pendingEffectsStatus = 0,
      pendingEffectsRoot = null,
      pendingFinishedWork = null,
      pendingEffectsLanes = 0,
      pendingEffectsRemainingLanes = 0,
      pendingEffectsRenderEndTime = -0,
      pendingPassiveTransitions = null,
      pendingRecoverableErrors = null,
      pendingViewTransition = null,
      pendingViewTransitionEvents = null,
      pendingTransitionTypes = null,
      pendingDidIncludeRenderPhaseUpdate = !1,
      pendingSuspendedCommitReason = null,
      pendingDelayedCommitReason = IMMEDIATE_COMMIT,
      pendingSuspendedViewTransitionReason = null,
      NESTED_UPDATE_LIMIT = 50,
      nestedUpdateCount = 0,
      rootWithNestedUpdates = null,
      isFlushingPassiveEffects = !1,
      didScheduleUpdateDuringPassiveEffects = !1,
      NESTED_PASSIVE_UPDATE_LIMIT = 50,
      nestedPassiveUpdateCount = 0,
      rootWithPassiveNestedUpdates = null,
      isRunningInsertionEffect = !1,
      didWarnAboutInterruptedViewTransitions = !1,
      didWarnStateUpdateForNotYetMountedComponent = null,
      didWarnAboutUpdateInRender = !1;
    var didWarnAboutUpdateInRenderForAnotherComponent = new Set();
    var fakeActCallbackNode = {},
      resolveFamily = null,
      failedBoundaries = null;
    var hasBadMapPolyfill = !1;
    try {
      var nonExtensibleObject = Object.preventExtensions({});
      new Map([[nonExtensibleObject, null]]);
      new Set([nonExtensibleObject]);
    } catch (e) {
      hasBadMapPolyfill = !0;
    }
    var createFiber = enableObjectFiber
      ? createFiberImplObject
      : createFiberImplClass;
    var didWarnAboutNestedUpdates = !1;
    var didWarnAboutFindNodeInStrictMode = {};
    var overrideHookState = null,
      overrideHookStateDeletePath = null,
      overrideHookStateRenamePath = null,
      overrideProps = null,
      overridePropsDeletePath = null,
      overridePropsRenamePath = null,
      scheduleUpdate = null,
      scheduleRetry = null,
      setErrorHandler = null,
      setSuspenseHandler = null;
    overrideHookState = function (fiber, id, path, value) {
      id = findHook(fiber, id);
      null !== id &&
        ((path = copyWithSetImpl(id.memoizedState, path, 0, value)),
        (id.memoizedState = path),
        (id.baseState = path),
        (fiber.memoizedProps = assign({}, fiber.memoizedProps)),
        (path = enqueueConcurrentRenderForLane(fiber, 2)),
        null !== path && scheduleUpdateOnFiber(path, fiber, 2));
    };
    overrideHookStateDeletePath = function (fiber, id, path) {
      id = findHook(fiber, id);
      null !== id &&
        ((path = copyWithDeleteImpl(id.memoizedState, path, 0)),
        (id.memoizedState = path),
        (id.baseState = path),
        (fiber.memoizedProps = assign({}, fiber.memoizedProps)),
        (path = enqueueConcurrentRenderForLane(fiber, 2)),
        null !== path && scheduleUpdateOnFiber(path, fiber, 2));
    };
    overrideHookStateRenamePath = function (fiber, id, oldPath, newPath) {
      id = findHook(fiber, id);
      null !== id &&
        ((oldPath = copyWithRename(id.memoizedState, oldPath, newPath)),
        (id.memoizedState = oldPath),
        (id.baseState = oldPath),
        (fiber.memoizedProps = assign({}, fiber.memoizedProps)),
        (oldPath = enqueueConcurrentRenderForLane(fiber, 2)),
        null !== oldPath && scheduleUpdateOnFiber(oldPath, fiber, 2));
    };
    overrideProps = function (fiber, path, value) {
      fiber.pendingProps = copyWithSetImpl(fiber.memoizedProps, path, 0, value);
      fiber.alternate && (fiber.alternate.pendingProps = fiber.pendingProps);
      path = enqueueConcurrentRenderForLane(fiber, 2);
      null !== path && scheduleUpdateOnFiber(path, fiber, 2);
    };
    overridePropsDeletePath = function (fiber, path) {
      fiber.pendingProps = copyWithDeleteImpl(fiber.memoizedProps, path, 0);
      fiber.alternate && (fiber.alternate.pendingProps = fiber.pendingProps);
      path = enqueueConcurrentRenderForLane(fiber, 2);
      null !== path && scheduleUpdateOnFiber(path, fiber, 2);
    };
    overridePropsRenamePath = function (fiber, oldPath, newPath) {
      fiber.pendingProps = copyWithRename(
        fiber.memoizedProps,
        oldPath,
        newPath
      );
      fiber.alternate && (fiber.alternate.pendingProps = fiber.pendingProps);
      oldPath = enqueueConcurrentRenderForLane(fiber, 2);
      null !== oldPath && scheduleUpdateOnFiber(oldPath, fiber, 2);
    };
    scheduleUpdate = function (fiber) {
      var root = enqueueConcurrentRenderForLane(fiber, 2);
      null !== root && scheduleUpdateOnFiber(root, fiber, 2);
    };
    scheduleRetry = function (fiber) {
      var lane = claimNextRetryLane(),
        root = enqueueConcurrentRenderForLane(fiber, lane);
      null !== root && scheduleUpdateOnFiber(root, fiber, lane);
    };
    setErrorHandler = function (newShouldErrorImpl) {
      shouldErrorImpl = newShouldErrorImpl;
    };
    setSuspenseHandler = function (newShouldSuspendImpl) {
      shouldSuspendImpl = newShouldSuspendImpl;
    };
    exports.attemptContinuousHydration = function (fiber) {
      if (13 === fiber.tag || 31 === fiber.tag) {
        var root = enqueueConcurrentRenderForLane(fiber, 67108864);
        null !== root && scheduleUpdateOnFiber(root, fiber, 67108864);
        markRetryLaneIfNotHydrated(fiber, 67108864);
      }
    };
    exports.attemptHydrationAtCurrentPriority = function (fiber) {
      if (13 === fiber.tag || 31 === fiber.tag) {
        var lane = requestUpdateLane(fiber);
        lane = getBumpedLaneForHydrationByLane(lane);
        var root = enqueueConcurrentRenderForLane(fiber, lane);
        null !== root && scheduleUpdateOnFiber(root, fiber, lane);
        markRetryLaneIfNotHydrated(fiber, lane);
      }
    };
    exports.attemptSynchronousHydration = function (fiber) {
      switch (fiber.tag) {
        case 3:
          fiber = fiber.stateNode;
          if (fiber.current.memoizedState.isDehydrated) {
            var lanes = getHighestPriorityLanes(fiber.pendingLanes);
            if (0 !== lanes) {
              fiber.pendingLanes |= 2;
              for (fiber.entangledLanes |= 2; lanes; ) {
                var lane = 1 << (31 - clz32(lanes));
                fiber.entanglements[1] |= lane;
                lanes &= ~lane;
              }
              ensureRootIsScheduled(fiber);
              (executionContext & (RenderContext | CommitContext)) ===
                NoContext &&
                ((workInProgressRootRenderTargetTime =
                  now$1() + RENDER_TIMEOUT_MS),
                flushSyncWorkAcrossRoots_impl(0, !1));
            }
          }
          break;
        case 31:
        case 13:
          (lanes = enqueueConcurrentRenderForLane(fiber, 2)),
            null !== lanes && scheduleUpdateOnFiber(lanes, fiber, 2),
            flushSyncWork(),
            markRetryLaneIfNotHydrated(fiber, 2);
      }
    };
    exports.batchedUpdates = function (fn, a) {
      return fn(a);
    };
    exports.createComponentSelector = function (component) {
      return { $$typeof: COMPONENT_TYPE, value: component };
    };
    exports.createContainer = function (
      containerInfo,
      tag,
      hydrationCallbacks,
      isStrictMode,
      concurrentUpdatesByDefaultOverride,
      identifierPrefix,
      onUncaughtError,
      onCaughtError,
      onRecoverableError,
      onDefaultTransitionIndicator,
      transitionCallbacks
    ) {
      containerInfo = createFiberRoot(
        containerInfo,
        tag,
        !1,
        null,
        hydrationCallbacks,
        isStrictMode,
        identifierPrefix,
        null,
        onUncaughtError,
        onCaughtError,
        onRecoverableError,
        onDefaultTransitionIndicator,
        transitionCallbacks
      );
      registerDefaultIndicator(onDefaultTransitionIndicator);
      return containerInfo;
    };
    exports.createHasPseudoClassSelector = function (selectors) {
      return { $$typeof: HAS_PSEUDO_CLASS_TYPE, value: selectors };
    };
    exports.createHydrationContainer = function (
      initialChildren,
      callback,
      containerInfo,
      tag,
      hydrationCallbacks,
      isStrictMode,
      concurrentUpdatesByDefaultOverride,
      identifierPrefix,
      onUncaughtError,
      onCaughtError,
      onRecoverableError,
      onDefaultTransitionIndicator,
      transitionCallbacks,
      formState
    ) {
      initialChildren = createFiberRoot(
        containerInfo,
        tag,
        !0,
        initialChildren,
        hydrationCallbacks,
        isStrictMode,
        identifierPrefix,
        formState,
        onUncaughtError,
        onCaughtError,
        onRecoverableError,
        onDefaultTransitionIndicator,
        transitionCallbacks
      );
      registerDefaultIndicator(onDefaultTransitionIndicator);
      initialChildren.context = getContextForSubtree(null);
      onDefaultTransitionIndicator = initialChildren.current;
      containerInfo = requestUpdateLane(onDefaultTransitionIndicator);
      containerInfo = getBumpedLaneForHydrationByLane(containerInfo);
      tag = createUpdate(containerInfo);
      tag.callback = void 0 !== callback && null !== callback ? callback : null;
      enqueueUpdate(onDefaultTransitionIndicator, tag, containerInfo);
      startUpdateTimerByLane(containerInfo, "hydrateRoot()", null);
      callback = containerInfo;
      initialChildren.current.lanes = callback;
      markRootUpdated(initialChildren, callback);
      ensureRootIsScheduled(initialChildren);
      return initialChildren;
    };
    exports.createPortal = function (children, containerInfo, implementation) {
      var key =
        3 < arguments.length && void 0 !== arguments[3] ? arguments[3] : null;
      try {
        testStringCoercion(key);
        var JSCompiler_inline_result = !1;
      } catch (e$6) {
        JSCompiler_inline_result = !0;
      }
      JSCompiler_inline_result &&
        (console.error(
          "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.",
          ("function" === typeof Symbol &&
            Symbol.toStringTag &&
            key[Symbol.toStringTag]) ||
            key.constructor.name ||
            "Object"
        ),
        testStringCoercion(key));
      return {
        $$typeof: REACT_PORTAL_TYPE,
        key: null == key ? null : "" + key,
        children: children,
        containerInfo: containerInfo,
        implementation: implementation
      };
    };
    exports.createRoleSelector = function (role) {
      return { $$typeof: ROLE_TYPE, value: role };
    };
    exports.createTestNameSelector = function (id) {
      return { $$typeof: TEST_NAME_TYPE, value: id };
    };
    exports.createTextSelector = function (text) {
      return { $$typeof: TEXT_TYPE, value: text };
    };
    exports.defaultOnCaughtError = function (error) {
      var componentNameMessage = componentName
          ? "The above error occurred in the <" + componentName + "> component."
          : "The above error occurred in one of your React components.",
        recreateMessage =
          "React will try to recreate this component tree from scratch using the error boundary you provided, " +
          ((errorBoundaryName || "Anonymous") + ".");
      "object" === typeof error &&
      null !== error &&
      "string" === typeof error.environmentName
        ? bindToConsole(
            "error",
            ["%o\n\n%s\n\n%s\n", error, componentNameMessage, recreateMessage],
            error.environmentName
          )()
        : console.error(
            "%o\n\n%s\n\n%s\n",
            error,
            componentNameMessage,
            recreateMessage
          );
    };
    exports.defaultOnRecoverableError = function (error) {
      reportGlobalError(error);
    };
    exports.defaultOnUncaughtError = function (error) {
      reportGlobalError(error);
      console.warn(
        "%s\n\n%s\n",
        componentName
          ? "An error occurred in the <" + componentName + "> component."
          : "An error occurred in one of your React components.",
        "Consider adding an error boundary to your tree to customize error handling behavior.\nVisit https://react.dev/link/error-boundaries to learn more about error boundaries."
      );
    };
    exports.deferredUpdates = function (fn) {
      var prevTransition = ReactSharedInternals.T,
        previousPriority = getCurrentUpdatePriority();
      try {
        return (
          setCurrentUpdatePriority(32), (ReactSharedInternals.T = null), fn()
        );
      } finally {
        setCurrentUpdatePriority(previousPriority),
          (ReactSharedInternals.T = prevTransition);
      }
    };
    exports.discreteUpdates = function (fn, a, b, c, d) {
      var prevTransition = ReactSharedInternals.T,
        previousPriority = getCurrentUpdatePriority();
      try {
        return (
          setCurrentUpdatePriority(2),
          (ReactSharedInternals.T = null),
          fn(a, b, c, d)
        );
      } finally {
        setCurrentUpdatePriority(previousPriority),
          (ReactSharedInternals.T = prevTransition),
          executionContext === NoContext &&
            (workInProgressRootRenderTargetTime = now$1() + RENDER_TIMEOUT_MS);
      }
    };
    exports.findAllNodes = findAllNodes;
    exports.findBoundingRects = function (hostRoot, selectors) {
      if (!supportsTestSelectors)
        throw Error("Test selector API is not supported by this renderer.");
      selectors = findAllNodes(hostRoot, selectors);
      hostRoot = [];
      for (var i = 0; i < selectors.length; i++)
        hostRoot.push(getBoundingRect(selectors[i]));
      for (selectors = hostRoot.length - 1; 0 < selectors; selectors--) {
        i = hostRoot[selectors];
        for (
          var targetLeft = i.x,
            targetRight = targetLeft + i.width,
            targetTop = i.y,
            targetBottom = targetTop + i.height,
            j = selectors - 1;
          0 <= j;
          j--
        )
          if (selectors !== j) {
            var otherRect = hostRoot[j],
              otherLeft = otherRect.x,
              otherRight = otherLeft + otherRect.width,
              otherTop = otherRect.y,
              otherBottom = otherTop + otherRect.height;
            if (
              targetLeft >= otherLeft &&
              targetTop >= otherTop &&
              targetRight <= otherRight &&
              targetBottom <= otherBottom
            ) {
              hostRoot.splice(selectors, 1);
              break;
            } else if (
              !(
                targetLeft !== otherLeft ||
                i.width !== otherRect.width ||
                otherBottom < targetTop ||
                otherTop > targetBottom
              )
            ) {
              otherTop > targetTop &&
                ((otherRect.height += otherTop - targetTop),
                (otherRect.y = targetTop));
              otherBottom < targetBottom &&
                (otherRect.height = targetBottom - otherTop);
              hostRoot.splice(selectors, 1);
              break;
            } else if (
              !(
                targetTop !== otherTop ||
                i.height !== otherRect.height ||
                otherRight < targetLeft ||
                otherLeft > targetRight
              )
            ) {
              otherLeft > targetLeft &&
                ((otherRect.width += otherLeft - targetLeft),
                (otherRect.x = targetLeft));
              otherRight < targetRight &&
                (otherRect.width = targetRight - otherLeft);
              hostRoot.splice(selectors, 1);
              break;
            }
          }
      }
      return hostRoot;
    };
    exports.findHostInstance = function (component) {
      var fiber = component._reactInternals;
      if (void 0 === fiber) {
        if ("function" === typeof component.render)
          throw Error("Unable to find node on an unmounted component.");
        component = Object.keys(component).join(",");
        throw Error(
          "Argument appears to not be a ReactComponent. Keys: " + component
        );
      }
      component = findCurrentHostFiber(fiber);
      return null === component ? null : getPublicInstance(component.stateNode);
    };
    exports.findHostInstanceWithNoPortals = function (fiber) {
      fiber = findCurrentFiberUsingSlowPath(fiber);
      fiber =
        null !== fiber ? findCurrentHostFiberWithNoPortalsImpl(fiber) : null;
      return null === fiber ? null : getPublicInstance(fiber.stateNode);
    };
    exports.findHostInstanceWithWarning = function (component, methodName) {
      var fiber = component._reactInternals;
      if (void 0 === fiber) {
        if ("function" === typeof component.render)
          throw Error("Unable to find node on an unmounted component.");
        component = Object.keys(component).join(",");
        throw Error(
          "Argument appears to not be a ReactComponent. Keys: " + component
        );
      }
      component = findCurrentHostFiber(fiber);
      if (null === component) return null;
      if (component.mode & 8) {
        var componentName = getComponentNameFromFiber(fiber) || "Component";
        didWarnAboutFindNodeInStrictMode[componentName] ||
          ((didWarnAboutFindNodeInStrictMode[componentName] = !0),
          runWithFiberInDEV(component, function () {
            fiber.mode & 8
              ? console.error(
                  "%s is deprecated in StrictMode. %s was passed an instance of %s which is inside StrictMode. Instead, add a ref directly to the element you want to reference. Learn more about using refs safely here: https://react.dev/link/strict-mode-find-node",
                  methodName,
                  methodName,
                  componentName
                )
              : console.error(
                  "%s is deprecated in StrictMode. %s was passed an instance of %s which renders StrictMode children. Instead, add a ref directly to the element you want to reference. Learn more about using refs safely here: https://react.dev/link/strict-mode-find-node",
                  methodName,
                  methodName,
                  componentName
                );
          }));
      }
      return getPublicInstance(component.stateNode);
    };
    exports.flushPassiveEffects = flushPendingEffects;
    exports.flushSyncFromReconciler = function (fn) {
      var prevExecutionContext = executionContext;
      executionContext |= 1;
      var prevTransition = ReactSharedInternals.T,
        previousPriority = getCurrentUpdatePriority();
      try {
        if ((setCurrentUpdatePriority(2), (ReactSharedInternals.T = null), fn))
          return fn();
      } finally {
        setCurrentUpdatePriority(previousPriority),
          (ReactSharedInternals.T = prevTransition),
          (executionContext = prevExecutionContext),
          (executionContext & (RenderContext | CommitContext)) === NoContext &&
            flushSyncWorkAcrossRoots_impl(0, !1);
      }
    };
    exports.flushSyncWork = flushSyncWork;
    exports.focusWithin = function (hostRoot, selectors) {
      if (!supportsTestSelectors)
        throw Error("Test selector API is not supported by this renderer.");
      hostRoot = findFiberRootForHostRoot(hostRoot);
      selectors = findPaths(hostRoot, selectors);
      selectors = Array.from(selectors);
      for (hostRoot = 0; hostRoot < selectors.length; ) {
        var fiber = selectors[hostRoot++],
          tag = fiber.tag;
        if (!isHiddenSubtree(fiber)) {
          if (
            (5 === tag || 26 === tag || 27 === tag) &&
            setFocusIfFocusable(fiber.stateNode)
          )
            return !0;
          for (fiber = fiber.child; null !== fiber; )
            selectors.push(fiber), (fiber = fiber.sibling);
        }
      }
      return !1;
    };
    exports.getFindAllNodesFailureDescription = function (hostRoot, selectors) {
      if (!supportsTestSelectors)
        throw Error("Test selector API is not supported by this renderer.");
      var maxSelectorIndex = 0,
        matchedNames = [];
      hostRoot = [findFiberRootForHostRoot(hostRoot), 0];
      for (var index = 0; index < hostRoot.length; ) {
        var fiber = hostRoot[index++],
          tag = fiber.tag,
          selectorIndex = hostRoot[index++],
          selector = selectors[selectorIndex];
        if ((5 !== tag && 26 !== tag && 27 !== tag) || !isHiddenSubtree(fiber))
          if (
            (matchSelector(fiber, selector) &&
              (matchedNames.push(selectorToString(selector)),
              selectorIndex++,
              selectorIndex > maxSelectorIndex &&
                (maxSelectorIndex = selectorIndex)),
            selectorIndex < selectors.length)
          )
            for (fiber = fiber.child; null !== fiber; )
              hostRoot.push(fiber, selectorIndex), (fiber = fiber.sibling);
      }
      if (maxSelectorIndex < selectors.length) {
        for (
          hostRoot = [];
          maxSelectorIndex < selectors.length;
          maxSelectorIndex++
        )
          hostRoot.push(selectorToString(selectors[maxSelectorIndex]));
        return (
          "findAllNodes was able to match part of the selector:\n  " +
          (matchedNames.join(" > ") +
            "\n\nNo matching component was found for:\n  ") +
          hostRoot.join(" > ")
        );
      }
      return null;
    };
    exports.getPublicRootInstance = function (container) {
      container = container.current;
      if (!container.child) return null;
      switch (container.child.tag) {
        case 27:
        case 5:
          return getPublicInstance(container.child.stateNode);
        default:
          return container.child.stateNode;
      }
    };
    exports.injectIntoDevTools = function () {
      var internals = {
        bundleType: 1,
        version: rendererVersion,
        rendererPackageName: rendererPackageName,
        currentDispatcherRef: ReactSharedInternals,
        reconcilerVersion: "19.3.0-www-modern-ec7d9a72-20251019"
      };
      null !== extraDevToolsConfig &&
        (internals.rendererConfig = extraDevToolsConfig);
      internals.overrideHookState = overrideHookState;
      internals.overrideHookStateDeletePath = overrideHookStateDeletePath;
      internals.overrideHookStateRenamePath = overrideHookStateRenamePath;
      internals.overrideProps = overrideProps;
      internals.overridePropsDeletePath = overridePropsDeletePath;
      internals.overridePropsRenamePath = overridePropsRenamePath;
      internals.scheduleUpdate = scheduleUpdate;
      internals.scheduleRetry = scheduleRetry;
      internals.setErrorHandler = setErrorHandler;
      internals.setSuspenseHandler = setSuspenseHandler;
      internals.scheduleRefresh = scheduleRefresh;
      internals.scheduleRoot = scheduleRoot;
      internals.setRefreshHandler = setRefreshHandler;
      internals.getCurrentFiber = getCurrentFiberForDevTools;
      enableSchedulingProfiler &&
        ((internals.getLaneLabelMap = getLaneLabelMap),
        (internals.injectProfilingHooks = injectProfilingHooks));
      return injectInternals(internals);
    };
    exports.isAlreadyRendering = isAlreadyRendering;
    exports.observeVisibleRects = function (
      hostRoot,
      selectors,
      callback,
      options
    ) {
      function commitHook() {
        var nextInstanceRoots = findAllNodes(hostRoot, selectors);
        instanceRoots.forEach(function (target) {
          0 > nextInstanceRoots.indexOf(target) && unobserve(target);
        });
        nextInstanceRoots.forEach(function (target) {
          0 > instanceRoots.indexOf(target) && observe(target);
        });
      }
      if (!supportsTestSelectors)
        throw Error("Test selector API is not supported by this renderer.");
      var instanceRoots = findAllNodes(hostRoot, selectors);
      callback = setupIntersectionObserver(instanceRoots, callback, options);
      var disconnect = callback.disconnect,
        observe = callback.observe,
        unobserve = callback.unobserve;
      commitHooks.push(commitHook);
      return {
        disconnect: function () {
          var index = commitHooks.indexOf(commitHook);
          0 <= index && commitHooks.splice(index, 1);
          disconnect();
        }
      };
    };
    exports.shouldError = function (fiber) {
      return shouldErrorImpl(fiber);
    };
    exports.shouldSuspend = function (fiber) {
      return shouldSuspendImpl(fiber);
    };
    exports.startHostTransition = function (
      formFiber,
      pendingState,
      action,
      formData
    ) {
      if (5 !== formFiber.tag)
        throw Error(
          "Expected the form instance to be a HostComponent. This is a bug in React."
        );
      var queue = ensureFormComponentIsStateful(formFiber).queue;
      startHostActionTimer(formFiber);
      startTransition(
        formFiber,
        queue,
        pendingState,
        NotPendingTransition,
        null === action
          ? noop
          : function () {
              null === ReactSharedInternals.T &&
                console.error(
                  "requestFormReset was called outside a transition or action. To fix, move to an action, or wrap with startTransition."
                );
              var stateHook = ensureFormComponentIsStateful(formFiber);
              null === stateHook.next &&
                (stateHook = formFiber.alternate.memoizedState);
              dispatchSetStateInternal(
                formFiber,
                stateHook.next.queue,
                {},
                requestUpdateLane(formFiber)
              );
              return action(formData);
            }
      );
    };
    exports.updateContainer = function (
      element,
      container,
      parentComponent,
      callback
    ) {
      var current = container.current,
        lane = requestUpdateLane(current);
      updateContainerImpl(
        current,
        lane,
        element,
        container,
        parentComponent,
        callback
      );
      return lane;
    };
    exports.updateContainerSync = updateContainerSync;
    return exports;
  }),
  (module.exports.default = module.exports),
  Object.defineProperty(module.exports, "__esModule", { value: !0 }));
