/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 * @nolint
 * @preventMunge
 * @generated SignedSource<<15615c3d20476ac50ae460f32f30be1b>>
 */

"use strict";
__DEV__ &&
  (function () {
    function JSCompiler_object_inline_createNodeMock_1092() {
      return null;
    }
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
        warn("copyWithRename() expects paths of the same length");
      else {
        for (var i = 0; i < newPath.length - 1; i++)
          if (oldPath[i] !== newPath[i]) {
            warn(
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
    function createFiber(tag, pendingProps, key, mode) {
      return new FiberNode(tag, pendingProps, key, mode);
    }
    function scheduleRoot(root, element) {
      root.context === emptyContextObject &&
        (0 === root.tag && flushPassiveEffects(),
        updateContainerImpl(root.current, 2, element, root, null, null),
        flushSyncWork());
    }
    function scheduleRefresh(root, update) {
      if (null !== resolveFamily) {
        var staleFamilies = update.staleFamilies;
        update = update.updatedFamilies;
        flushPassiveEffects();
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
      error$jscomp$0(
        "Do not call Hooks inside useEffect(...), useMemo(...), or other built-in Hooks. You can only call Hooks at the top level of your React function. For more information, see https://react.dev/link/rules-of-hooks"
      );
    }
    function warnInvalidContextAccess() {
      error$jscomp$0(
        "Context can only be read while React is rendering. In classes, you can read it in the render method or getDerivedStateFromProps. In function components, you can read it directly in the function body, but not inside Hooks like useReducer() or useMemo()."
      );
    }
    function warnForMissingKey() {}
    function setToSortedString(set) {
      var array = [];
      set.forEach(function (value) {
        array.push(value);
      });
      return array.sort().join(", ");
    }
    function warn(format) {
      for (
        var _len = arguments.length,
          args = Array(1 < _len ? _len - 1 : 0),
          _key = 1;
        _key < _len;
        _key++
      )
        args[_key - 1] = arguments[_key];
      printWarning("warn", format, args);
    }
    function error$jscomp$0(format) {
      for (
        var _len2 = arguments.length,
          args = Array(1 < _len2 ? _len2 - 1 : 0),
          _key2 = 1;
        _key2 < _len2;
        _key2++
      )
        args[_key2 - 1] = arguments[_key2];
      printWarning("error", format, args);
    }
    function printWarning(level, format, args) {
      if (ReactSharedInternals.getCurrentStack) {
        var stack = ReactSharedInternals.getCurrentStack();
        "" !== stack && ((format += "%s"), (args = args.concat([stack])));
      }
      args.unshift(format);
      Function.prototype.apply.call(console[level], console, args);
    }
    function _defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || !1;
        descriptor.configurable = !0;
        "value" in descriptor && (descriptor.writable = !0);
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }
    function _createClass(Constructor, protoProps, staticProps) {
      protoProps && _defineProperties(Constructor.prototype, protoProps);
      staticProps && _defineProperties(Constructor, staticProps);
      return Constructor;
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
        case REACT_PORTAL_TYPE:
          return "Portal";
        case REACT_PROFILER_TYPE:
          return "Profiler";
        case REACT_STRICT_MODE_TYPE:
          return "StrictMode";
        case REACT_SUSPENSE_TYPE:
          return "Suspense";
        case REACT_SUSPENSE_LIST_TYPE:
          return "SuspenseList";
      }
      if ("object" === typeof type)
        switch (
          ("number" === typeof type.tag &&
            error$jscomp$0(
              "Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."
            ),
          type.$$typeof)
        ) {
          case REACT_CONTEXT_TYPE:
            return (type.displayName || "Context") + ".Provider";
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
        case 24:
          return "Cache";
        case 9:
          return (type._context.displayName || "Context") + ".Consumer";
        case 10:
          return (type.displayName || "Context") + ".Provider";
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
        case 17:
        case 28:
        case 1:
        case 0:
        case 14:
        case 15:
          if ("function" === typeof type)
            return type.displayName || type.name || null;
          if ("string" === typeof type) return type;
          break;
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
        error$jscomp$0(
          "disabledDepth fell below zero. This is a bug in React. Please file an issue."
        );
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
      try {
        var _RunInRootFrame$Deter =
            RunInRootFrame.DetermineComponentFrameRoot(),
          sampleStack = _RunInRootFrame$Deter[0],
          controlStack = _RunInRootFrame$Deter[1];
        if (sampleStack && controlStack) {
          var sampleLines = sampleStack.split("\n"),
            controlLines = controlStack.split("\n");
          for (
            sampleStack = _RunInRootFrame$Deter = 0;
            _RunInRootFrame$Deter < sampleLines.length &&
            !sampleLines[_RunInRootFrame$Deter].includes(
              "DetermineComponentFrameRoot"
            );

          )
            _RunInRootFrame$Deter++;
          for (
            ;
            sampleStack < controlLines.length &&
            !controlLines[sampleStack].includes("DetermineComponentFrameRoot");

          )
            sampleStack++;
          if (
            _RunInRootFrame$Deter === sampleLines.length ||
            sampleStack === controlLines.length
          )
            for (
              _RunInRootFrame$Deter = sampleLines.length - 1,
                sampleStack = controlLines.length - 1;
              1 <= _RunInRootFrame$Deter &&
              0 <= sampleStack &&
              sampleLines[_RunInRootFrame$Deter] !== controlLines[sampleStack];

            )
              sampleStack--;
          for (
            ;
            1 <= _RunInRootFrame$Deter && 0 <= sampleStack;
            _RunInRootFrame$Deter--, sampleStack--
          )
            if (
              sampleLines[_RunInRootFrame$Deter] !== controlLines[sampleStack]
            ) {
              if (1 !== _RunInRootFrame$Deter || 1 !== sampleStack) {
                do
                  if (
                    (_RunInRootFrame$Deter--,
                    sampleStack--,
                    0 > sampleStack ||
                      sampleLines[_RunInRootFrame$Deter] !==
                        controlLines[sampleStack])
                  ) {
                    var _frame =
                      "\n" +
                      sampleLines[_RunInRootFrame$Deter].replace(
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
                while (1 <= _RunInRootFrame$Deter && 0 <= sampleStack);
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
    function getStackByFiberInDevAndProd(workInProgress) {
      try {
        var info = "";
        do {
          info += describeFiber(workInProgress);
          var debugInfo = workInProgress._debugInfo;
          if (debugInfo)
            for (var i = debugInfo.length - 1; 0 <= i; i--) {
              var entry = debugInfo[i];
              if ("string" === typeof entry.name) {
                var JSCompiler_temp_const = info,
                  env = entry.env;
                var JSCompiler_inline_result = describeBuiltInComponentFrame(
                  entry.name + (env ? " [" + env + "]" : "")
                );
                info = JSCompiler_temp_const + JSCompiler_inline_result;
              }
            }
          workInProgress = workInProgress.return;
        } while (workInProgress);
        return info;
      } catch (x) {
        return "\nError generating stack: " + x.message + "\n" + x.stack;
      }
    }
    function getCurrentFiberStackInDev() {
      return null === current ? "" : getStackByFiberInDevAndProd(current);
    }
    function runWithFiberInDEV(fiber, callback, arg0, arg1, arg2, arg3, arg4) {
      var previousFiber = current;
      ReactSharedInternals.getCurrentStack =
        null === fiber ? null : getCurrentFiberStackInDev;
      isRendering = !1;
      current = fiber;
      try {
        return callback(arg0, arg1, arg2, arg3, arg4);
      } finally {
        current = previousFiber;
      }
      throw Error(
        "runWithFiberInDEV should never be called in production. This is a bug in React."
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
    function injectInternals(internals) {
      if ("undefined" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__) return !1;
      var hook = __REACT_DEVTOOLS_GLOBAL_HOOK__;
      if (hook.isDisabled) return !0;
      if (!hook.supportsFiber)
        return (
          error$jscomp$0(
            "The installed version of React DevTools is too old and will not work with the current version of React. Please update React DevTools. https://react.dev/link/react-devtools"
          ),
          !0
        );
      try {
        (rendererID = hook.inject(internals)), (injectedHook = hook);
      } catch (err) {
        error$jscomp$0("React instrumentation encountered an error: %s.", err);
      }
      return hook.checkDCE ? !0 : !1;
    }
    function onCommitRoot(root, eventPriority) {
      if (injectedHook && "function" === typeof injectedHook.onCommitFiberRoot)
        try {
          var didError = 128 === (root.current.flags & 128);
          switch (eventPriority) {
            case DiscreteEventPriority:
              var schedulerPriority = ImmediatePriority;
              break;
            case ContinuousEventPriority:
              schedulerPriority = UserBlockingPriority;
              break;
            case DefaultEventPriority:
              schedulerPriority = NormalPriority$1;
              break;
            case IdleEventPriority:
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
            error$jscomp$0(
              "React instrumentation encountered an error: %s",
              err
            ));
        }
    }
    function setIsStrictModeForDevtools(newIsStrictMode) {
      newIsStrictMode ? disableLogs() : reenableLogs();
    }
    function injectProfilingHooks(profilingHooks) {
      injectedProfilingHooks = profilingHooks;
    }
    function markCommitStopped() {
      null !== injectedProfilingHooks &&
        "function" === typeof injectedProfilingHooks.markCommitStopped &&
        injectedProfilingHooks.markCommitStopped();
    }
    function markComponentRenderStarted(fiber) {
      null !== injectedProfilingHooks &&
        "function" ===
          typeof injectedProfilingHooks.markComponentRenderStarted &&
        injectedProfilingHooks.markComponentRenderStarted(fiber);
    }
    function markComponentRenderStopped() {
      null !== injectedProfilingHooks &&
        "function" ===
          typeof injectedProfilingHooks.markComponentRenderStopped &&
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
      if (lane & 64) return "TransitionHydration";
      if (lane & 4194176) return "Transition";
      if (lane & 62914560) return "Retry";
      if (lane & 67108864) return "SelectiveHydration";
      if (lane & 134217728) return "IdleHydration";
      if (lane & 268435456) return "Idle";
      if (lane & 536870912) return "Offscreen";
      if (lane & 1073741824) return "Deferred";
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
          return lanes & 4194176;
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
            error$jscomp$0(
              "Should have found matching lanes. This is a bug in React."
            ),
            lanes
          );
      }
    }
    function getNextLanes(root, wipLanes) {
      var pendingLanes = root.pendingLanes;
      if (0 === pendingLanes) return 0;
      var nextLanes = 0,
        suspendedLanes = root.suspendedLanes;
      root = root.pingedLanes;
      var nonIdlePendingLanes = pendingLanes & 134217727;
      0 !== nonIdlePendingLanes
        ? ((pendingLanes = nonIdlePendingLanes & ~suspendedLanes),
          0 !== pendingLanes
            ? (nextLanes = getHighestPriorityLanes(pendingLanes))
            : ((root &= nonIdlePendingLanes),
              0 !== root && (nextLanes = getHighestPriorityLanes(root))))
        : ((pendingLanes &= ~suspendedLanes),
          0 !== pendingLanes
            ? (nextLanes = getHighestPriorityLanes(pendingLanes))
            : 0 !== root && (nextLanes = getHighestPriorityLanes(root)));
      return 0 === nextLanes
        ? 0
        : 0 !== wipLanes &&
            wipLanes !== nextLanes &&
            0 === (wipLanes & suspendedLanes) &&
            ((suspendedLanes = nextLanes & -nextLanes),
            (root = wipLanes & -wipLanes),
            suspendedLanes >= root ||
              (32 === suspendedLanes && 0 !== (root & 4194176)))
          ? wipLanes
          : nextLanes;
    }
    function computeExpirationTime(lane, currentTime) {
      switch (lane) {
        case 1:
        case 2:
        case 4:
        case 8:
          return currentTime + 250;
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
          return -1;
        case 67108864:
        case 134217728:
        case 268435456:
        case 536870912:
        case 1073741824:
          return -1;
        default:
          return (
            error$jscomp$0(
              "Should have found matching lanes. This is a bug in React."
            ),
            -1
          );
      }
    }
    function claimNextTransitionLane() {
      var lane = nextTransitionLane;
      nextTransitionLane <<= 1;
      0 === (nextTransitionLane & 4194176) && (nextTransitionLane = 128);
      return lane;
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
      268435456 !== updateLane &&
        ((root.suspendedLanes = 0),
        (root.pingedLanes = 0),
        (root.warmLanes = 0));
    }
    function markRootFinished(
      root,
      finishedLanes,
      remainingLanes,
      spawnedLane
    ) {
      var previouslyPendingLanes = root.pendingLanes;
      root.pendingLanes = remainingLanes;
      root.suspendedLanes = 0;
      root.pingedLanes = 0;
      root.warmLanes = 0;
      root.expiredLanes &= remainingLanes;
      root.entangledLanes &= remainingLanes;
      root.errorRecoveryDisabledLanes &= remainingLanes;
      root.shellSuspendCounter = 0;
      finishedLanes = root.entanglements;
      var expirationTimes = root.expirationTimes,
        hiddenUpdates = root.hiddenUpdates;
      for (
        remainingLanes = previouslyPendingLanes & ~remainingLanes;
        0 < remainingLanes;

      ) {
        var index = 31 - clz32(remainingLanes);
        previouslyPendingLanes = 1 << index;
        finishedLanes[index] = 0;
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
        remainingLanes &= ~previouslyPendingLanes;
      }
      0 !== spawnedLane && markSpawnedDeferredLane(root, spawnedLane, 0);
    }
    function markSpawnedDeferredLane(root, spawnedLane, entangledLanes) {
      root.pendingLanes |= spawnedLane;
      root.suspendedLanes &= ~spawnedLane;
      var spawnedLaneIndex = 31 - clz32(spawnedLane);
      root.entangledLanes |= spawnedLane;
      root.entanglements[spawnedLaneIndex] =
        root.entanglements[spawnedLaneIndex] |
        1073741824 |
        (entangledLanes & 4194218);
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
    function lanesToEventPriority(lanes) {
      lanes &= -lanes;
      return 0 !== DiscreteEventPriority && DiscreteEventPriority < lanes
        ? 0 !== ContinuousEventPriority && ContinuousEventPriority < lanes
          ? 0 !== (lanes & 134217727)
            ? DefaultEventPriority
            : IdleEventPriority
          : ContinuousEventPriority
        : DiscreteEventPriority;
    }
    function shim$1() {
      throw Error(
        "The current renderer does not support hydration. This error is likely caused by a bug in React. Please file an issue."
      );
    }
    function shim() {
      throw Error(
        "The current renderer does not support Resources. This error is likely caused by a bug in React. Please file an issue."
      );
    }
    function getPublicInstance(inst) {
      switch (inst.tag) {
        case "INSTANCE":
          var createNodeMock = inst.rootContainerInstance.createNodeMock;
          createNodeMock = createNodeMock({
            type: inst.type,
            props: inst.props
          });
          "object" === typeof createNodeMock &&
            null !== createNodeMock &&
            nodeToInstanceMap.set(createNodeMock, inst);
          return createNodeMock;
        default:
          return inst;
      }
    }
    function appendChild(parentInstance, child) {
      isArrayImpl(parentInstance.children) ||
        error$jscomp$0(
          "An invalid container has been provided. This may indicate that another renderer is being used in addition to the test renderer. (For example, ReactDOM.createPortal inside of a ReactTestRenderer tree.) This is not supported."
        );
      var index = parentInstance.children.indexOf(child);
      -1 !== index && parentInstance.children.splice(index, 1);
      parentInstance.children.push(child);
    }
    function insertBefore(parentInstance, child, beforeChild) {
      var index = parentInstance.children.indexOf(child);
      -1 !== index && parentInstance.children.splice(index, 1);
      beforeChild = parentInstance.children.indexOf(beforeChild);
      parentInstance.children.splice(beforeChild, 0, child);
    }
    function removeChild(parentInstance, child) {
      child = parentInstance.children.indexOf(child);
      parentInstance.children.splice(child, 1);
    }
    function commitUpdate(instance, type, oldProps, newProps) {
      instance.type = type;
      instance.props = newProps;
    }
    function commitMount() {}
    function commitTextUpdate(textInstance, oldText, newText) {
      textInstance.text = newText;
    }
    function resetTextContent() {}
    function hideInstance(instance) {
      instance.isHidden = !0;
    }
    function hideTextInstance(textInstance) {
      textInstance.isHidden = !0;
    }
    function unhideInstance(instance) {
      instance.isHidden = !1;
    }
    function unhideTextInstance(textInstance) {
      textInstance.isHidden = !1;
    }
    function getInstanceFromNode(mockNode) {
      mockNode = nodeToInstanceMap.get(mockNode);
      return void 0 !== mockNode ? mockNode.internalInstanceHandle : null;
    }
    function bindToConsole(methodName, args, badgeName) {
      var offset = 0;
      switch (methodName) {
        case "dir":
        case "dirxml":
        case "groupEnd":
        case "table":
          return bind.apply(console[methodName], [console].concat(args));
        case "assert":
          offset = 1;
      }
      args = args.slice(0);
      "string" === typeof args[offset]
        ? args.splice(offset, 1, "[%s] " + args[offset], " " + badgeName + " ")
        : args.splice(offset, 0, "[%s] ", " " + badgeName + " ");
      args.unshift(console);
      return bind.apply(console[methodName], args);
    }
    function createCursor(defaultValue) {
      return { current: defaultValue };
    }
    function pop(cursor, fiber) {
      0 > index$jscomp$0
        ? error$jscomp$0("Unexpected pop.")
        : (fiber !== fiberStack[index$jscomp$0] &&
            error$jscomp$0("Unexpected Fiber popped."),
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
    function popContext(fiber) {
      pop(didPerformWorkStackCursor, fiber);
      pop(contextStackCursor$1, fiber);
    }
    function popTopLevelContextObject(fiber) {
      pop(didPerformWorkStackCursor, fiber);
      pop(contextStackCursor$1, fiber);
    }
    function pushTopLevelContextObject(fiber, context, didChange) {
      if (contextStackCursor$1.current !== emptyContextObject)
        throw Error(
          "Unexpected context found on stack. This error is likely caused by a bug in React. Please file an issue."
        );
      push(contextStackCursor$1, context, fiber);
      push(didPerformWorkStackCursor, didChange, fiber);
    }
    function processChildContext(fiber, type, parentContext) {
      var instance = fiber.stateNode;
      type = type.childContextTypes;
      if ("function" !== typeof instance.getChildContext)
        return (
          (fiber = getComponentNameFromFiber(fiber) || "Unknown"),
          warnedAboutMissingGetChildContext[fiber] ||
            ((warnedAboutMissingGetChildContext[fiber] = !0),
            error$jscomp$0(
              "%s.childContextTypes is specified but there is no getChildContext() method on the instance. You can either define getChildContext() on %s or remove childContextTypes from it.",
              fiber,
              fiber
            )),
          parentContext
        );
      instance = instance.getChildContext();
      for (var contextKey in instance)
        if (!(contextKey in type))
          throw Error(
            (getComponentNameFromFiber(fiber) || "Unknown") +
              '.getChildContext(): key "' +
              contextKey +
              '" is not defined in childContextTypes.'
          );
      return assign({}, parentContext, instance);
    }
    function pushContextProvider(workInProgress) {
      var instance = workInProgress.stateNode;
      instance =
        (instance && instance.__reactInternalMemoizedMergedChildContext) ||
        emptyContextObject;
      previousContext = contextStackCursor$1.current;
      push(contextStackCursor$1, instance, workInProgress);
      push(
        didPerformWorkStackCursor,
        didPerformWorkStackCursor.current,
        workInProgress
      );
      return !0;
    }
    function invalidateContextProvider(workInProgress, type, didChange) {
      var instance = workInProgress.stateNode;
      if (!instance)
        throw Error(
          "Expected to have an instance by this point. This error is likely caused by a bug in React. Please file an issue."
        );
      didChange
        ? ((type = processChildContext(workInProgress, type, previousContext)),
          (instance.__reactInternalMemoizedMergedChildContext = type),
          pop(didPerformWorkStackCursor, workInProgress),
          pop(contextStackCursor$1, workInProgress),
          push(contextStackCursor$1, type, workInProgress))
        : pop(didPerformWorkStackCursor, workInProgress);
      push(didPerformWorkStackCursor, didChange, workInProgress);
    }
    function is(x, y) {
      return (x === y && (0 !== x || 1 / x === 1 / y)) || (x !== x && y !== y);
    }
    function createCapturedValueAtFiber(value, source) {
      if ("object" === typeof value && null !== value) {
        var stack = CapturedStacks.get(value);
        "string" !== typeof stack &&
          ((stack = getStackByFiberInDevAndProd(source)),
          CapturedStacks.set(value, stack));
      } else stack = getStackByFiberInDevAndProd(source);
      return { value: value, source: source, stack: stack };
    }
    function requiredContext(c) {
      null === c &&
        error$jscomp$0(
          "Expected host context to exist. This error is likely caused by a bug in React. Please file an issue."
        );
      return c;
    }
    function pushHostContainer(fiber, nextRootInstance) {
      push(rootInstanceStackCursor, nextRootInstance, fiber);
      push(contextFiberStackCursor, fiber, fiber);
      push(contextStackCursor, null, fiber);
      nextRootInstance = NO_CONTEXT;
      pop(contextStackCursor, fiber);
      push(contextStackCursor, nextRootInstance, fiber);
    }
    function popHostContainer(fiber) {
      pop(contextStackCursor, fiber);
      pop(contextFiberStackCursor, fiber);
      pop(rootInstanceStackCursor, fiber);
    }
    function pushHostContext(fiber) {
      null !== fiber.memoizedState &&
        push(hostTransitionProviderCursor, fiber, fiber);
      var context = requiredContext(contextStackCursor.current),
        nextContext = NO_CONTEXT;
      context !== nextContext &&
        (push(contextFiberStackCursor, fiber, fiber),
        push(contextStackCursor, nextContext, fiber));
    }
    function popHostContext(fiber) {
      contextFiberStackCursor.current === fiber &&
        (pop(contextStackCursor, fiber), pop(contextFiberStackCursor, fiber));
      hostTransitionProviderCursor.current === fiber &&
        (pop(hostTransitionProviderCursor, fiber),
        (HostTransitionContext._currentValue2 = null));
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
              ? error$jscomp$0(
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
              sourceFiber._visibility & 1 ||
              (isHidden = !0)),
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
        (update.lane = lane | 536870912));
    }
    function getRootForUpdatedFiber(sourceFiber) {
      if (nestedUpdateCount > NESTED_UPDATE_LIMIT)
        throw (
          ((nestedPassiveUpdateCount = nestedUpdateCount = 0),
          (rootWithPassiveNestedUpdates = rootWithNestedUpdates = null),
          Error(
            "Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate. React limits the number of nested updates to prevent infinite loops."
          ))
        );
      nestedPassiveUpdateCount > NESTED_PASSIVE_UPDATE_LIMIT &&
        ((nestedPassiveUpdateCount = 0),
        (rootWithPassiveNestedUpdates = null),
        error$jscomp$0(
          "Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on every render."
        ));
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
        var elapsedTime = now() - profilerStartTime;
        profilerStartTime = -1;
        profilerEffectDuration += elapsedTime;
      }
    }
    function startEffectTimer() {
      profilerStartTime = now();
    }
    function transferActualDuration(fiber) {
      for (var child = fiber.child; child; )
        (fiber.actualDuration += child.actualDuration), (child = child.sibling);
    }
    function ensureRootIsScheduled(root) {
      root !== lastScheduledRoot &&
        null === root.next &&
        (null === lastScheduledRoot
          ? (firstScheduledRoot = lastScheduledRoot = root)
          : (lastScheduledRoot = lastScheduledRoot.next = root));
      mightHavePendingSyncWork = !0;
      null !== ReactSharedInternals.actQueue
        ? didScheduleMicrotask_act ||
          ((didScheduleMicrotask_act = !0),
          scheduleImmediateTask(processRootScheduleInMicrotask))
        : didScheduleMicrotask ||
          ((didScheduleMicrotask = !0),
          scheduleImmediateTask(processRootScheduleInMicrotask));
      ReactSharedInternals.isBatchingLegacy &&
        0 === root.tag &&
        (ReactSharedInternals.didScheduleLegacyUpdate = !0);
    }
    function flushSyncWorkAcrossRoots_impl(syncTransitionLanes, onlyLegacy) {
      if (!isFlushingWork && mightHavePendingSyncWork) {
        isFlushingWork = !0;
        do {
          var didPerformSomeWork = !1;
          for (var root = firstScheduledRoot; null !== root; ) {
            if (!onlyLegacy || 0 === root.tag)
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
                    nextLanes & 201326677
                      ? (nextLanes & 201326677) | 1
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
                    root === workInProgressRoot ? nextLanes : 0
                  )),
                  0 !== (nextLanes & 3) &&
                    ((didPerformSomeWork = !0),
                    performSyncWorkOnRoot(root, nextLanes));
            root = root.next;
          }
        } while (didPerformSomeWork);
        isFlushingWork = !1;
      }
    }
    function processRootScheduleInMicrotask() {
      mightHavePendingSyncWork =
        didScheduleMicrotask_act =
        didScheduleMicrotask =
          !1;
      0 !== currentEventTransitionLane && (currentEventTransitionLane = 0);
      for (
        var currentTime = now$1(), prev = null, root = firstScheduledRoot;
        null !== root;

      ) {
        var next = root.next,
          nextLanes = scheduleTaskForRootDuringMicrotask(root, currentTime);
        0 === nextLanes
          ? ((root.next = null),
            null === prev ? (firstScheduledRoot = next) : (prev.next = next),
            null === next && (lastScheduledRoot = prev))
          : ((prev = root),
            0 !== (nextLanes & 3) && (mightHavePendingSyncWork = !0));
        root = next;
      }
      flushSyncWorkAcrossRoots_impl(0, !1);
    }
    function scheduleTaskForRootDuringMicrotask(root, currentTime) {
      for (
        var suspendedLanes = root.suspendedLanes,
          pingedLanes = root.pingedLanes,
          expirationTimes = root.expirationTimes,
          lanes = root.pendingLanes & -62914561;
        0 < lanes;

      ) {
        var index = 31 - clz32(lanes),
          lane = 1 << index,
          expirationTime = expirationTimes[index];
        if (-1 === expirationTime) {
          if (0 === (lane & suspendedLanes) || 0 !== (lane & pingedLanes))
            expirationTimes[index] = computeExpirationTime(lane, currentTime);
        } else expirationTime <= currentTime && (root.expiredLanes |= lane);
        lanes &= ~lane;
      }
      currentTime = workInProgressRoot;
      suspendedLanes = workInProgressRootRenderLanes;
      suspendedLanes = getNextLanes(
        root,
        root === currentTime ? suspendedLanes : 0
      );
      pingedLanes = root.callbackNode;
      if (
        0 === suspendedLanes ||
        (root === currentTime &&
          workInProgressSuspendedReason === SuspendedOnData) ||
        null !== root.cancelPendingCommit
      )
        return (
          null !== pingedLanes && cancelCallback(pingedLanes),
          (root.callbackNode = null),
          (root.callbackPriority = 0)
        );
      if (0 !== (suspendedLanes & 3))
        return (
          null !== pingedLanes && cancelCallback(pingedLanes),
          (root.callbackPriority = 2),
          (root.callbackNode = null),
          2
        );
      currentTime = suspendedLanes & -suspendedLanes;
      if (
        currentTime !== root.callbackPriority ||
        (null !== ReactSharedInternals.actQueue &&
          pingedLanes !== fakeActCallbackNode$1)
      )
        cancelCallback(pingedLanes);
      else return currentTime;
      switch (lanesToEventPriority(suspendedLanes)) {
        case DiscreteEventPriority:
          suspendedLanes = ImmediatePriority;
          break;
        case ContinuousEventPriority:
          suspendedLanes = UserBlockingPriority;
          break;
        case DefaultEventPriority:
          suspendedLanes = NormalPriority$1;
          break;
        case IdleEventPriority:
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
    function performWorkOnRootViaSchedulerTask(root, didTimeout) {
      nestedUpdateScheduled = currentUpdateIsNested = !1;
      var originalCallbackNode = root.callbackNode;
      if (flushPassiveEffects() && root.callbackNode !== originalCallbackNode)
        return null;
      var workInProgressRootRenderLanes$jscomp$0 =
        workInProgressRootRenderLanes;
      workInProgressRootRenderLanes$jscomp$0 = getNextLanes(
        root,
        root === workInProgressRoot ? workInProgressRootRenderLanes$jscomp$0 : 0
      );
      if (0 === workInProgressRootRenderLanes$jscomp$0) return null;
      performWorkOnRoot(
        root,
        workInProgressRootRenderLanes$jscomp$0,
        didTimeout
      );
      scheduleTaskForRootDuringMicrotask(root, now$1());
      return root.callbackNode === originalCallbackNode
        ? performWorkOnRootViaSchedulerTask.bind(null, root)
        : null;
    }
    function performSyncWorkOnRoot(root, lanes) {
      if (flushPassiveEffects()) return null;
      currentUpdateIsNested = nestedUpdateScheduled;
      nestedUpdateScheduled = !1;
      performWorkOnRoot(root, lanes, !0);
    }
    function cancelCallback(callbackNode) {
      callbackNode !== fakeActCallbackNode$1 &&
        null !== callbackNode &&
        cancelCallback$1(callbackNode);
    }
    function scheduleImmediateTask(cb) {
      null !== ReactSharedInternals.actQueue &&
        ReactSharedInternals.actQueue.push(function () {
          cb();
          return null;
        });
      scheduleCallback$3(ImmediatePriority, cb);
    }
    function requestTransitionLane() {
      0 === currentEventTransitionLane &&
        (currentEventTransitionLane = claimNextTransitionLane());
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
      }
      currentEntangledPendingCount++;
      thenable.then(pingEngtangledActionScope, pingEngtangledActionScope);
      return thenable;
    }
    function pingEngtangledActionScope() {
      if (
        0 === --currentEntangledPendingCount &&
        null !== currentEntangledListeners
      ) {
        null !== currentEntangledActionThenable &&
          (currentEntangledActionThenable.status = "fulfilled");
        var listeners = currentEntangledListeners;
        currentEntangledListeners = null;
        currentEntangledLane = 0;
        currentEntangledActionThenable = null;
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
        error$jscomp$0(
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
      if (null !== fiber && ((fiber = fiber.shared), 0 !== (lane & 4194176))) {
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
      workInProgress$jscomp$0,
      props,
      instance$jscomp$0,
      renderLanes
    ) {
      didReadFromEntangledAsyncAction = !1;
      var queue = workInProgress$jscomp$0.updateQueue;
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
                case ReplaceState:
                  workInProgress = update.payload;
                  if ("function" === typeof workInProgress) {
                    isDisallowedContextReadInDEV = !0;
                    newState = workInProgress.call(
                      instance,
                      newState,
                      updateLane
                    );
                    isDisallowedContextReadInDEV = !1;
                    break a;
                  }
                  newState = workInProgress;
                  break a;
                case CaptureUpdate:
                  workInProgress.flags = (workInProgress.flags & -65537) | 128;
                case UpdateState:
                  workInProgress = update.payload;
                  "function" === typeof workInProgress
                    ? ((isDisallowedContextReadInDEV = !0),
                      (updateLane = workInProgress.call(
                        instance,
                        newState,
                        updateLane
                      )),
                      (isDisallowedContextReadInDEV = !1))
                    : (updateLane = workInProgress);
                  if (null === updateLane || void 0 === updateLane) break a;
                  newState = assign({}, newState, updateLane);
                  break a;
                case ForceUpdate:
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
    function noop() {}
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
            error$jscomp$0(
              "A component was suspended by an uncached promise. Creating promises inside a Client Component or hook is not yet supported, except via a Suspense-compatible library or framework."
            )),
          thenable.then(noop, noop),
          (thenable = index));
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
          if ("string" === typeof thenable.status) thenable.then(noop, noop);
          else {
            thenableState = workInProgressRoot;
            if (
              null !== thenableState &&
              100 < thenableState.shellSuspendCounter
            )
              throw Error(
                "async/await is not yet supported in Client Components, only Server Components. This error is often caused by accidentally adding `'use client'` to a module that was originally written for the server."
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
      if (rejectedReason === SuspenseException)
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
    function validateFragmentProps(element, fiber, returnFiber) {
      for (var keys = Object.keys(element.props), i = 0; i < keys.length; i++) {
        var key = keys[i];
        if ("children" !== key && "key" !== key) {
          null === fiber &&
            ((fiber = createFiberFromElement(element, returnFiber.mode, 0)),
            (fiber._debugInfo = currentDebugInfo),
            (fiber.return = returnFiber));
          runWithFiberInDEV(
            fiber,
            function (erroredKey) {
              error$jscomp$0(
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
    function coerceRef(returnFiber, current, workInProgress, element) {
      returnFiber = element.props.ref;
      workInProgress.ref = void 0 !== returnFiber ? returnFiber : null;
    }
    function throwOnInvalidObjectType(returnFiber, newChild) {
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
    function warnOnFunctionType(returnFiber, invalidChild) {
      var parentName = getComponentNameFromFiber(returnFiber) || "Component";
      ownerHasFunctionTypeWarning[parentName] ||
        ((ownerHasFunctionTypeWarning[parentName] = !0),
        (invalidChild =
          invalidChild.displayName || invalidChild.name || "Component"),
        3 === returnFiber.tag
          ? error$jscomp$0(
              "Functions are not valid as a React child. This may happen if you return %s instead of <%s /> from render. Or maybe you meant to call this function rather than return it.\n  root.render(%s)",
              invalidChild,
              invalidChild,
              invalidChild
            )
          : error$jscomp$0(
              "Functions are not valid as a React child. This may happen if you return %s instead of <%s /> from render. Or maybe you meant to call this function rather than return it.\n  <%s>{%s}</%s>",
              invalidChild,
              invalidChild,
              parentName,
              invalidChild,
              parentName
            ));
    }
    function warnOnSymbolType(returnFiber, invalidChild) {
      var parentName = getComponentNameFromFiber(returnFiber) || "Component";
      ownerHasSymbolTypeWarning[parentName] ||
        ((ownerHasSymbolTypeWarning[parentName] = !0),
        (invalidChild = String(invalidChild)),
        3 === returnFiber.tag
          ? error$jscomp$0(
              "Symbols are not valid as a React child.\n  root.render(%s)",
              invalidChild
            )
          : error$jscomp$0(
              "Symbols are not valid as a React child.\n  <%s>%s</%s>",
              parentName,
              invalidChild,
              parentName
            ));
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
              ? ((newFiber.flags |= 33554434), lastPlacedIndex)
              : newIndex
          );
        newFiber.flags |= 33554434;
        return lastPlacedIndex;
      }
      function placeSingleChild(newFiber) {
        shouldTrackSideEffects &&
          null === newFiber.alternate &&
          (newFiber.flags |= 33554434);
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
              callLazyInitInDEV(elementType) === current.type))
        )
          return (
            (lanes = useFiber(current, element.props)),
            coerceRef(returnFiber, current, lanes, element),
            (lanes.return = returnFiber),
            (lanes._debugOwner = element._owner),
            (lanes._debugInfo = currentDebugInfo),
            lanes
          );
        lanes = createFiberFromElement(element, returnFiber.mode, lanes);
        coerceRef(returnFiber, current, lanes, element);
        lanes.return = returnFiber;
        lanes._debugInfo = currentDebugInfo;
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
                coerceRef(returnFiber, null, lanes, newChild),
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
              newChild = callLazyInitInDEV(newChild);
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
                (newChild = callLazyInitInDEV(newChild)),
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
              newChild = callLazyInitInDEV(newChild);
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
              error$jscomp$0(
                "Encountered two children with the same key, `%s`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted \u2014 the behavior is unsupported and could change in a future version.",
                key
              );
            });
            break;
          case REACT_LAZY_TYPE:
            (child = callLazyInitInDEV(child)),
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
            deleteRemainingChildren(returnFiber, oldFiber), resultingFirstChild
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
            deleteRemainingChildren(returnFiber, oldFiber), resultingFirstChild
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
          (validateFragmentProps(newChild, null, returnFiber),
          (newChild = newChild.props.children));
        if ("object" === typeof newChild && null !== newChild) {
          switch (newChild.$$typeof) {
            case REACT_ELEMENT_TYPE:
              var prevDebugInfo = pushDebugInfo(newChild._debugInfo);
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
                        currentFirstChild._debugOwner = newChild._owner;
                        currentFirstChild._debugInfo = currentDebugInfo;
                        validateFragmentProps(
                          newChild,
                          currentFirstChild,
                          returnFiber
                        );
                        returnFiber = currentFirstChild;
                        break a;
                      }
                    } else if (
                      child.elementType === key ||
                      isCompatibleFamilyForHotReloading(child, newChild) ||
                      ("object" === typeof key &&
                        null !== key &&
                        key.$$typeof === REACT_LAZY_TYPE &&
                        callLazyInitInDEV(key) === child.type)
                    ) {
                      deleteRemainingChildren(returnFiber, child.sibling);
                      currentFirstChild = useFiber(child, newChild.props);
                      coerceRef(
                        returnFiber,
                        child,
                        currentFirstChild,
                        newChild
                      );
                      currentFirstChild.return = returnFiber;
                      currentFirstChild._debugOwner = newChild._owner;
                      currentFirstChild._debugInfo = currentDebugInfo;
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
                    (currentFirstChild._debugOwner = returnFiber),
                    (currentFirstChild._debugInfo = currentDebugInfo),
                    validateFragmentProps(
                      newChild,
                      currentFirstChild,
                      returnFiber
                    ),
                    (returnFiber = currentFirstChild))
                  : ((lanes = createFiberFromElement(
                      newChild,
                      returnFiber.mode,
                      lanes
                    )),
                    coerceRef(returnFiber, currentFirstChild, lanes, newChild),
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
                      currentFirstChild = useFiber(
                        currentFirstChild,
                        prevDebugInfo.children || []
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
                  prevDebugInfo,
                  returnFiber.mode,
                  lanes
                );
                currentFirstChild.return = returnFiber;
                returnFiber = currentFirstChild;
              }
              return placeSingleChild(returnFiber);
            case REACT_LAZY_TYPE:
              return (
                (prevDebugInfo = pushDebugInfo(newChild._debugInfo)),
                (newChild = callLazyInitInDEV(newChild)),
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
            child = getIteratorFn(newChild);
            if ("function" !== typeof child)
              throw Error(
                "An object is not an iterable. This error is likely caused by a bug in React. Please file an issue."
              );
            key = child.call(newChild);
            if (key === newChild) {
              if (
                0 !== returnFiber.tag ||
                "[object GeneratorFunction]" !==
                  Object.prototype.toString.call(returnFiber.type) ||
                "[object Generator]" !== Object.prototype.toString.call(key)
              )
                didWarnAboutGenerators ||
                  error$jscomp$0(
                    "Using Iterators as children is unsupported and will likely yield unexpected results because enumerating a generator mutates it. You may convert it to an array with `Array.from()` or the `[...spread]` operator before rendering. You can also use an Iterable that can iterate multiple times over the same items."
                  ),
                  (didWarnAboutGenerators = !0);
            } else
              newChild.entries !== child ||
                didWarnAboutMaps ||
                (error$jscomp$0(
                  "Using Maps as children is not supported. Use an array of keyed ReactElements instead."
                ),
                (didWarnAboutMaps = !0));
            returnFiber = reconcileChildrenIterator(
              returnFiber,
              currentFirstChild,
              key,
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
                (currentFirstChild = useFiber(
                  currentFirstChild,
                  prevDebugInfo
                )),
                (currentFirstChild.return = returnFiber),
                (returnFiber = currentFirstChild))
              : (deleteRemainingChildren(returnFiber, currentFirstChild),
                (currentFirstChild = createFiberFromText(
                  prevDebugInfo,
                  returnFiber.mode,
                  lanes
                )),
                (currentFirstChild.return = returnFiber),
                (currentFirstChild._debugOwner = returnFiber),
                (currentFirstChild._debugInfo = currentDebugInfo),
                (returnFiber = currentFirstChild)),
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
          if (
            x === SuspenseException ||
            (0 === (returnFiber.mode & 1) &&
              "object" === typeof x &&
              null !== x &&
              "function" === typeof x.then)
          )
            throw x;
          var fiber = createFiber(29, x, null, returnFiber.mode);
          fiber.lanes = lanes;
          fiber.return = returnFiber;
          var debugInfo = (fiber._debugInfo = currentDebugInfo);
          fiber._debugOwner = returnFiber._debugOwner;
          if (null != debugInfo)
            for (var i = debugInfo.length - 1; 0 <= i; i--)
              if ("string" === typeof debugInfo[i].stack) {
                fiber._debugOwner = debugInfo[i];
                break;
              }
          return fiber;
        } finally {
          currentDebugInfo = prevDebugInfo;
        }
      };
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
      var current = handler.alternate;
      push(
        suspenseStackCursor,
        suspenseStackCursor.current & SubtreeSuspenseContextMask,
        handler
      );
      push(suspenseHandlerStackCursor, handler, handler);
      null === shellBoundary &&
        (null === current || null !== currentTreeHiddenStackCursor.current
          ? (shellBoundary = handler)
          : null !== current.memoizedState && (shellBoundary = handler));
    }
    function pushOffscreenSuspenseHandler(fiber) {
      if (22 === fiber.tag) {
        if (
          (push(suspenseStackCursor, suspenseStackCursor.current, fiber),
          push(suspenseHandlerStackCursor, fiber, fiber),
          null === shellBoundary)
        ) {
          var current = fiber.alternate;
          null !== current &&
            null !== current.memoizedState &&
            (shellBoundary = fiber);
        }
      } else reuseSuspenseHandlerOnStack(fiber);
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
            (null === state.dehydrated ||
              isSuspenseInstancePending() ||
              isSuspenseInstanceFallback())
          )
            return node;
        } else if (
          19 === node.tag &&
          void 0 !== node.memoizedProps.revealOrder
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
        var componentName = getComponentNameFromFiber(
          currentlyRenderingFiber$1
        );
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
          error$jscomp$0(
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
        error$jscomp$0(
          "%s received a final argument that is not an array (instead, received `%s`). When specified, the final argument must be an array.",
          currentHookNameInDev,
          typeof deps
        );
    }
    function warnOnUseFormStateInDev() {
      var componentName = getComponentNameFromFiber(currentlyRenderingFiber$1);
      didWarnAboutUseFormState.has(componentName) ||
        (didWarnAboutUseFormState.add(componentName),
        error$jscomp$0(
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
          error$jscomp$0(
            "%s received a final argument during this render, but not during the previous render. Even though the final argument is optional, its type cannot change between renders.",
            currentHookNameInDev
          ),
          !1
        );
      nextDeps.length !== prevDeps.length &&
        error$jscomp$0(
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
      currentlyRenderingFiber$1 = workInProgress;
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
        (nextRenderLanes = getComponentNameFromFiber(
          currentlyRenderingFiber$1
        )),
          didWarnAboutAsyncClientComponent.has(nextRenderLanes) ||
            (didWarnAboutAsyncClientComponent.add(nextRenderLanes),
            error$jscomp$0(
              "async/await is not yet supported in Client Components, only Server Components. This error is often caused by accidentally adding `'use client'` to a module that was originally written for the server."
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
      shouldDoubleInvokeUserFnsInHooksDEV = !1;
      nextRenderLanes = callComponentInDEV(Component, props, secondArg);
      shouldDoubleInvokeUserFnsInHooksDEV = !1;
      didScheduleRenderPhaseUpdateDuringThisPass &&
        (nextRenderLanes = renderWithHooksAgain(
          workInProgress,
          Component,
          props,
          secondArg
        ));
      finishRenderingHooks(current, workInProgress);
      return nextRenderLanes;
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
        currentlyRenderingFiber$1 =
          null;
      hookTypesUpdateIndexDev = -1;
      null !== current &&
        (current.flags & 31457280) !== (workInProgress.flags & 31457280) &&
        0 !== (current.mode & 1) &&
        error$jscomp$0(
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
          error$jscomp$0(
            "`use` was called from inside a try/catch block. This is not allowed and can lead to unexpected behavior. To handle errors triggered by `use`, wrap your component in a error boundary."
          )));
    }
    function renderWithHooksAgain(workInProgress, Component, props, secondArg) {
      currentlyRenderingFiber$1 = workInProgress;
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
        dispatcher && (currentlyRenderingFiber$1.flags |= 1024);
      return maybeThenable;
    }
    function bailoutHooks(current, workInProgress, lanes) {
      workInProgress.updateQueue = current.updateQueue;
      workInProgress.flags =
        0 !== (workInProgress.mode & 16)
          ? workInProgress.flags & -201328645
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
        currentlyRenderingFiber$1 =
          null;
      hookTypesUpdateIndexDev = -1;
      currentHookNameInDev = null;
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
        ? (currentlyRenderingFiber$1.memoizedState = workInProgressHook = hook)
        : (workInProgressHook = workInProgressHook.next = hook);
      return workInProgressHook;
    }
    function updateWorkInProgressHook() {
      if (null === currentHook) {
        var nextCurrentHook = currentlyRenderingFiber$1.alternate;
        nextCurrentHook =
          null !== nextCurrentHook ? nextCurrentHook.memoizedState : null;
      } else nextCurrentHook = currentHook.next;
      var nextWorkInProgressHook =
        null === workInProgressHook
          ? currentlyRenderingFiber$1.memoizedState
          : workInProgressHook.next;
      if (null !== nextWorkInProgressHook)
        (workInProgressHook = nextWorkInProgressHook),
          (currentHook = nextCurrentHook);
      else {
        if (null === nextCurrentHook) {
          if (null === currentlyRenderingFiber$1.alternate)
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
          ? (currentlyRenderingFiber$1.memoizedState = workInProgressHook =
              nextCurrentHook)
          : (workInProgressHook = workInProgressHook.next = nextCurrentHook);
      }
      return workInProgressHook;
    }
    function useThenable(thenable) {
      var index = thenableIndexCounter;
      thenableIndexCounter += 1;
      null === thenableState && (thenableState = createThenableState());
      thenable = trackUsedThenable(thenableState, thenable, index);
      index = currentlyRenderingFiber$1;
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
        updateQueue = currentlyRenderingFiber$1.updateQueue;
      null !== updateQueue && (memoCache = updateQueue.memoCache);
      if (null == memoCache) {
        var current = currentlyRenderingFiber$1.alternate;
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
        (currentlyRenderingFiber$1.updateQueue = updateQueue));
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
          error$jscomp$0(
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
        shouldDoubleInvokeUserFnsInHooksDEV &&
          (setIsStrictModeForDevtools(!0),
          init(initialArg),
          setIsStrictModeForDevtools(!1));
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
        currentlyRenderingFiber$1,
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
          error$jscomp$0(
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
                action: update.action,
                hasEagerState: update.hasEagerState,
                eagerState: update.eagerState,
                next: null
              }),
                null === newBaseQueueLast
                  ? ((newBaseQueueFirst = newBaseQueueLast = updateLane),
                    (baseFirst = pendingQueue))
                  : (newBaseQueueLast = newBaseQueueLast.next = updateLane),
                (currentlyRenderingFiber$1.lanes |= revertLane),
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
              action: update.action,
              hasEagerState: update.hasEagerState,
              eagerState: update.eagerState,
              next: null
            }),
              null === newBaseQueueLast
                ? ((newBaseQueueFirst = newBaseQueueLast = revertLane),
                  (baseFirst = pendingQueue))
                : (newBaseQueueLast = newBaseQueueLast.next = revertLane),
              (currentlyRenderingFiber$1.lanes |= updateLane),
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
    function mountSyncExternalStore(subscribe, getSnapshot) {
      var fiber = currentlyRenderingFiber$1,
        hook = mountWorkInProgressHook();
      var nextSnapshot = getSnapshot();
      if (!didWarnUncachedGetSnapshot) {
        var cachedSnapshot = getSnapshot();
        objectIs(nextSnapshot, cachedSnapshot) ||
          (error$jscomp$0(
            "The result of getSnapshot should be cached to avoid an infinite loop"
          ),
          (didWarnUncachedGetSnapshot = !0));
      }
      if (null === workInProgressRoot)
        throw Error(
          "Expected a work-in-progress root. This is a bug in React. Please file an issue."
        );
      0 !== (workInProgressRootRenderLanes & 60) ||
        pushStoreConsistencyCheck(fiber, getSnapshot, nextSnapshot);
      hook.memoizedState = nextSnapshot;
      cachedSnapshot = { value: nextSnapshot, getSnapshot: getSnapshot };
      hook.queue = cachedSnapshot;
      mountEffect(
        subscribeToStore.bind(null, fiber, cachedSnapshot, subscribe),
        [subscribe]
      );
      fiber.flags |= 2048;
      pushEffect(
        HasEffect | Passive,
        updateStoreInstance.bind(
          null,
          fiber,
          cachedSnapshot,
          nextSnapshot,
          getSnapshot
        ),
        { destroy: void 0 },
        null
      );
      return nextSnapshot;
    }
    function updateSyncExternalStore(subscribe, getSnapshot) {
      var fiber = currentlyRenderingFiber$1,
        hook = updateWorkInProgressHook();
      var nextSnapshot = getSnapshot();
      if (!didWarnUncachedGetSnapshot) {
        var cachedSnapshot = getSnapshot();
        objectIs(nextSnapshot, cachedSnapshot) ||
          (error$jscomp$0(
            "The result of getSnapshot should be cached to avoid an infinite loop"
          ),
          (didWarnUncachedGetSnapshot = !0));
      }
      if (
        (cachedSnapshot = !objectIs(
          (currentHook || hook).memoizedState,
          nextSnapshot
        ))
      )
        (hook.memoizedState = nextSnapshot), (didReceiveUpdate = !0);
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
        pushEffect(
          HasEffect | Passive,
          updateStoreInstance.bind(
            null,
            fiber,
            hook,
            nextSnapshot,
            getSnapshot
          ),
          { destroy: void 0 },
          null
        );
        if (null === workInProgressRoot)
          throw Error(
            "Expected a work-in-progress root. This is a bug in React. Please file an issue."
          );
        0 !== (renderLanes & 60) ||
          pushStoreConsistencyCheck(fiber, getSnapshot, nextSnapshot);
      }
      return nextSnapshot;
    }
    function pushStoreConsistencyCheck(fiber, getSnapshot, renderedSnapshot) {
      fiber.flags |= 16384;
      fiber = { getSnapshot: getSnapshot, value: renderedSnapshot };
      getSnapshot = currentlyRenderingFiber$1.updateQueue;
      null === getSnapshot
        ? ((getSnapshot = createFunctionComponentUpdateQueue()),
          (currentlyRenderingFiber$1.updateQueue = getSnapshot),
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
        checkIfSnapshotChanged(inst) && forceStoreRerender(fiber);
      });
    }
    function checkIfSnapshotChanged(inst) {
      var latestGetSnapshot = inst.getSnapshot;
      inst = inst.value;
      try {
        var nextValue = latestGetSnapshot();
        return !objectIs(inst, nextValue);
      } catch (error$6) {
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
        shouldDoubleInvokeUserFnsInHooksDEV &&
          (setIsStrictModeForDevtools(!0),
          initialStateInitializer(),
          setIsStrictModeForDevtools(!1));
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
        dispatch = dispatchSetState.bind(
          null,
          currentlyRenderingFiber$1,
          queue
        );
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
        currentlyRenderingFiber$1,
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
        ReactSharedInternals.T = currentTransition;
        ReactSharedInternals.T._updatedFibers = new Set();
        try {
          var returnValue = action(prevState, payload),
            onStartTransitionFinish = ReactSharedInternals.S;
          null !== onStartTransitionFinish &&
            onStartTransitionFinish(currentTransition, returnValue);
          handleActionReturnValue(actionQueue, node, returnValue);
        } catch (error$7) {
          onActionError(actionQueue, node, error$7);
        } finally {
          (ReactSharedInternals.T = prevTransition),
            null === prevTransition &&
              currentTransition._updatedFibers &&
              ((actionQueue = currentTransition._updatedFibers.size),
              currentTransition._updatedFibers.clear(),
              10 < actionQueue &&
                warn(
                  "Detected a large number of updates inside startTransition. If this is due to a subscription please re-write it to use React provided hooks. Otherwise concurrent mode guarantees are off the table."
                ));
        }
      } else
        try {
          (currentTransition = action(prevState, payload)),
            handleActionReturnValue(actionQueue, node, currentTransition);
        } catch (error$8) {
          onActionError(actionQueue, node, error$8);
        }
    }
    function handleActionReturnValue(actionQueue, node, returnValue) {
      null !== returnValue &&
      "object" === typeof returnValue &&
      "function" === typeof returnValue.then
        ? (returnValue.then(
            function (nextState) {
              onActionSuccess(actionQueue, node, nextState);
            },
            function (error) {
              return onActionError(actionQueue, node, error);
            }
          ),
          node.isTransition ||
            error$jscomp$0(
              "An async function was passed to useActionState, but it was dispatched outside of an action context. This is likely not what you intended. Either pass the dispatch function to an `action` prop, or dispatch manually inside `startTransition`"
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
      var stateHook = mountWorkInProgressHook();
      stateHook.memoizedState = stateHook.baseState = initialStateProp;
      var stateQueue = {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: actionStateReducer,
        lastRenderedState: initialStateProp
      };
      stateHook.queue = stateQueue;
      stateHook = dispatchSetState.bind(
        null,
        currentlyRenderingFiber$1,
        stateQueue
      );
      stateQueue.dispatch = stateHook;
      stateQueue = mountStateImpl(!1);
      var setPendingState = dispatchOptimisticSetState.bind(
        null,
        currentlyRenderingFiber$1,
        !1,
        stateQueue.queue
      );
      stateQueue = mountWorkInProgressHook();
      var actionQueue = {
        state: initialStateProp,
        dispatch: null,
        action: action,
        pending: null
      };
      stateQueue.queue = actionQueue;
      stateHook = dispatchActionState.bind(
        null,
        currentlyRenderingFiber$1,
        actionQueue,
        setPendingState,
        stateHook
      );
      actionQueue.dispatch = stateHook;
      stateQueue.memoizedState = action;
      return [initialStateProp, stateHook, !1];
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
      currentStateHook =
        "object" === typeof currentStateHook &&
        null !== currentStateHook &&
        "function" === typeof currentStateHook.then
          ? useThenable(currentStateHook)
          : currentStateHook;
      var actionQueueHook = updateWorkInProgressHook(),
        actionQueue = actionQueueHook.queue,
        dispatch = actionQueue.dispatch;
      action !== actionQueueHook.memoizedState &&
        ((currentlyRenderingFiber$1.flags |= 2048),
        pushEffect(
          HasEffect | Passive,
          actionStateActionEffect.bind(null, actionQueue, action),
          { destroy: void 0 },
          null
        ));
      return [currentStateHook, dispatch, stateHook];
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
    function pushEffect(tag, create, inst, deps) {
      tag = { tag: tag, create: create, inst: inst, deps: deps, next: null };
      create = currentlyRenderingFiber$1.updateQueue;
      null === create &&
        ((create = createFunctionComponentUpdateQueue()),
        (currentlyRenderingFiber$1.updateQueue = create));
      inst = create.lastEffect;
      null === inst
        ? (create.lastEffect = tag.next = tag)
        : ((deps = inst.next),
          (inst.next = tag),
          (tag.next = deps),
          (create.lastEffect = tag));
      return tag;
    }
    function mountRef(initialValue) {
      var hook = mountWorkInProgressHook();
      initialValue = { current: initialValue };
      return (hook.memoizedState = initialValue);
    }
    function mountEffectImpl(fiberFlags, hookFlags, create, deps) {
      var hook = mountWorkInProgressHook();
      currentlyRenderingFiber$1.flags |= fiberFlags;
      hook.memoizedState = pushEffect(
        HasEffect | hookFlags,
        create,
        { destroy: void 0 },
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
        ? (hook.memoizedState = pushEffect(hookFlags, create, inst, deps))
        : ((currentlyRenderingFiber$1.flags |= fiberFlags),
          (hook.memoizedState = pushEffect(
            HasEffect | hookFlags,
            create,
            inst,
            deps
          )));
    }
    function mountEffect(create, deps) {
      0 !== (currentlyRenderingFiber$1.mode & 16) &&
      0 === (currentlyRenderingFiber$1.mode & 64)
        ? mountEffectImpl(142608384, Passive, create, deps)
        : mountEffectImpl(8390656, Passive, create, deps);
    }
    function mountLayoutEffect(create, deps) {
      var fiberFlags = 4194308;
      0 !== (currentlyRenderingFiber$1.mode & 16) && (fiberFlags |= 67108864);
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
            error$jscomp$0(
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
        error$jscomp$0(
          "Expected useImperativeHandle() second argument to be a function that creates a handle. Instead received: %s.",
          null !== create ? typeof create : "null"
        );
      deps = null !== deps && void 0 !== deps ? deps.concat([ref]) : null;
      var fiberFlags = 4194308;
      0 !== (currentlyRenderingFiber$1.mode & 16) && (fiberFlags |= 67108864);
      mountEffectImpl(
        fiberFlags,
        Layout,
        imperativeHandleEffect.bind(null, create, ref),
        deps
      );
    }
    function updateImperativeHandle(ref, create, deps) {
      "function" !== typeof create &&
        error$jscomp$0(
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
      shouldDoubleInvokeUserFnsInHooksDEV &&
        (setIsStrictModeForDevtools(!0),
        nextCreate(),
        setIsStrictModeForDevtools(!1));
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
      shouldDoubleInvokeUserFnsInHooksDEV &&
        (setIsStrictModeForDevtools(!0),
        nextCreate(),
        setIsStrictModeForDevtools(!1));
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
      if (void 0 === initialValue || 0 !== (renderLanes & 1073741824))
        return (hook.memoizedState = value);
      hook.memoizedState = initialValue;
      hook = requestDeferredLane();
      currentlyRenderingFiber$1.lanes |= hook;
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
      if (0 === (renderLanes & 42))
        return (didReceiveUpdate = !0), (hook.memoizedState = value);
      hook = requestDeferredLane();
      currentlyRenderingFiber$1.lanes |= hook;
      workInProgressRootSkippedLanes |= hook;
      return prevValue;
    }
    function startTransition(
      fiber,
      queue,
      pendingState,
      finishedState,
      callback
    ) {
      var previousPriority = currentUpdatePriority;
      currentUpdatePriority =
        0 !== previousPriority && previousPriority < ContinuousEventPriority
          ? previousPriority
          : ContinuousEventPriority;
      var prevTransition = ReactSharedInternals.T,
        currentTransition = {};
      ReactSharedInternals.T = currentTransition;
      dispatchOptimisticSetState(fiber, !1, queue, pendingState);
      currentTransition._updatedFibers = new Set();
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
      } catch (error$9) {
        dispatchSetStateInternal(
          fiber,
          queue,
          { then: function () {}, status: "rejected", reason: error$9 },
          requestUpdateLane(fiber)
        );
      } finally {
        (currentUpdatePriority = previousPriority),
          (ReactSharedInternals.T = prevTransition),
          null === prevTransition &&
            currentTransition._updatedFibers &&
            ((fiber = currentTransition._updatedFibers.size),
            currentTransition._updatedFibers.clear(),
            10 < fiber &&
              warn(
                "Detected a large number of updates inside startTransition. If this is due to a subscription please re-write it to use React provided hooks. Otherwise concurrent mode guarantees are off the table."
              ));
      }
    }
    function mountTransition() {
      var stateHook = mountStateImpl(!1);
      stateHook = startTransition.bind(
        null,
        currentlyRenderingFiber$1,
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
        identifierPrefix = workInProgressRoot.identifierPrefix,
        globalClientId = globalClientIdCounter++;
      identifierPrefix =
        ":" + identifierPrefix + "r" + globalClientId.toString(32) + ":";
      return (hook.memoizedState = identifierPrefix);
    }
    function mountRefresh() {
      return (mountWorkInProgressHook().memoizedState = refreshCache.bind(
        null,
        currentlyRenderingFiber$1
      ));
    }
    function refreshCache(fiber, seedKey) {
      for (var provider = fiber.return; null !== provider; ) {
        switch (provider.tag) {
          case 24:
          case 3:
            var lane = requestUpdateLane(provider);
            fiber = createUpdate(lane);
            var root = enqueueUpdate(provider, fiber, lane);
            null !== root &&
              (scheduleUpdateOnFiber(root, provider, lane),
              entangleTransitions(root, provider, lane));
            provider = createCache();
            null !== seedKey &&
              void 0 !== seedKey &&
              null !== root &&
              error$jscomp$0(
                "The seed argument is not enabled outside experimental channels."
              );
            fiber.payload = { cache: provider };
            return;
        }
        provider = provider.return;
      }
    }
    function dispatchReducerAction(
      fiber,
      queue,
      action,
      JSCompiler_OptimizeArgumentsArray_p0
    ) {
      "function" === typeof JSCompiler_OptimizeArgumentsArray_p0 &&
        error$jscomp$0(
          "State updates from the useState() and useReducer() Hooks don't support the second callback argument. To execute a side effect after rendering, declare it in the component body with useEffect()."
        );
      JSCompiler_OptimizeArgumentsArray_p0 = requestUpdateLane(fiber);
      action = {
        lane: JSCompiler_OptimizeArgumentsArray_p0,
        revertLane: 0,
        action: action,
        hasEagerState: !1,
        eagerState: null,
        next: null
      };
      isRenderPhaseUpdate(fiber)
        ? enqueueRenderPhaseUpdate(queue, action)
        : ((action = enqueueConcurrentHookUpdate(
            fiber,
            queue,
            action,
            JSCompiler_OptimizeArgumentsArray_p0
          )),
          null !== action &&
            (scheduleUpdateOnFiber(
              action,
              fiber,
              JSCompiler_OptimizeArgumentsArray_p0
            ),
            entangleTransitionUpdate(
              action,
              queue,
              JSCompiler_OptimizeArgumentsArray_p0
            )));
      markStateUpdateScheduled(fiber, JSCompiler_OptimizeArgumentsArray_p0);
    }
    function dispatchSetState(
      fiber,
      queue,
      action,
      JSCompiler_OptimizeArgumentsArray_p1
    ) {
      "function" === typeof JSCompiler_OptimizeArgumentsArray_p1 &&
        error$jscomp$0(
          "State updates from the useState() and useReducer() Hooks don't support the second callback argument. To execute a side effect after rendering, declare it in the component body with useEffect()."
        );
      JSCompiler_OptimizeArgumentsArray_p1 = requestUpdateLane(fiber);
      dispatchSetStateInternal(
        fiber,
        queue,
        action,
        JSCompiler_OptimizeArgumentsArray_p1
      );
      markStateUpdateScheduled(fiber, JSCompiler_OptimizeArgumentsArray_p1);
    }
    function dispatchSetStateInternal(fiber, queue, action, lane) {
      var update = {
        lane: lane,
        revertLane: 0,
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
          } catch (error$10) {
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
        error$jscomp$0(
          "An optimistic state update occurred outside a transition or action. To fix, move the update to an action, or wrap with startTransition."
        );
      action = {
        lane: 2,
        revertLane: requestTransitionLane(),
        action: action,
        hasEagerState: !1,
        eagerState: null,
        next: null
      };
      if (isRenderPhaseUpdate(fiber)) {
        if (throwIfDuringRender)
          throw Error("Cannot update optimistic state while rendering.");
        error$jscomp$0("Cannot call startTransition while rendering.");
      } else
        (throwIfDuringRender = enqueueConcurrentHookUpdate(
          fiber,
          queue,
          action,
          2
        )),
          null !== throwIfDuringRender &&
            scheduleUpdateOnFiber(throwIfDuringRender, fiber, 2);
      markStateUpdateScheduled(fiber, 2);
    }
    function isRenderPhaseUpdate(fiber) {
      var alternate = fiber.alternate;
      return (
        fiber === currentlyRenderingFiber$1 ||
        (null !== alternate && alternate === currentlyRenderingFiber$1)
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
      if (0 !== (lane & 4194176)) {
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
          error$jscomp$0(
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
      var prevState = workInProgress.memoizedState;
      getDerivedStateFromProps = getDerivedStateFromProps(nextProps, prevState);
      void 0 === getDerivedStateFromProps &&
        ((ctor = getComponentNameFromType(ctor) || "Component"),
        didWarnAboutUndefinedDerivedState.has(ctor) ||
          (didWarnAboutUndefinedDerivedState.add(ctor),
          error$jscomp$0(
            "%s.getDerivedStateFromProps(): A valid state object (or null) must be returned. You have returned undefined.",
            ctor
          )));
      prevState =
        null === getDerivedStateFromProps || void 0 === getDerivedStateFromProps
          ? prevState
          : assign({}, prevState, getDerivedStateFromProps);
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
      workInProgress = workInProgress.stateNode;
      return "function" === typeof workInProgress.shouldComponentUpdate
        ? ((oldProps = workInProgress.shouldComponentUpdate(
            newProps,
            newState,
            nextContext
          )),
          void 0 === oldProps &&
            error$jscomp$0(
              "%s.shouldComponentUpdate(): Returned undefined instead of a boolean value. Make sure to return true or false.",
              getComponentNameFromType(ctor) || "Component"
            ),
          oldProps)
        : ctor.prototype && ctor.prototype.isPureReactComponent
          ? !shallowEqual(oldProps, newProps) ||
            !shallowEqual(oldState, newState)
          : !0;
    }
    function constructClassInstance(workInProgress, ctor, props) {
      var isLegacyContextConsumer = !1,
        unmaskedContext = emptyContextObject;
      var context = ctor.contextType;
      if (
        "contextType" in ctor &&
        null !== context &&
        (void 0 === context || context.$$typeof !== REACT_CONTEXT_TYPE) &&
        !didWarnAboutInvalidateContextType.has(ctor)
      ) {
        didWarnAboutInvalidateContextType.add(ctor);
        var addendum =
          void 0 === context
            ? " However, it is set to undefined. This can be caused by a typo or by mixing up named and default imports. This can also happen due to a circular dependency, so try moving the createContext() call to a separate file."
            : "object" !== typeof context
              ? " However, it is set to a " + typeof context + "."
              : context.$$typeof === REACT_CONSUMER_TYPE
                ? " Did you accidentally pass the Context.Consumer instead?"
                : " However, it is set to an object with keys {" +
                  Object.keys(context).join(", ") +
                  "}.";
        error$jscomp$0(
          "%s defines an invalid contextType. contextType should point to the Context object returned by React.createContext().%s",
          getComponentNameFromType(ctor) || "Component",
          addendum
        );
      }
      "object" === typeof context && null !== context
        ? (context = readContext(context))
        : ((unmaskedContext = isContextProvider(ctor)
            ? previousContext
            : contextStackCursor$1.current),
          (isLegacyContextConsumer = ctor.contextTypes),
          (context = (isLegacyContextConsumer =
            null !== isLegacyContextConsumer &&
            void 0 !== isLegacyContextConsumer)
            ? getMaskedContext(workInProgress, unmaskedContext)
            : emptyContextObject));
      props = new ctor(props, context);
      addendum = workInProgress.memoizedState =
        null !== props.state && void 0 !== props.state ? props.state : null;
      props.updater = classComponentUpdater;
      workInProgress.stateNode = props;
      props._reactInternals = workInProgress;
      props._reactInternalInstance = fakeInternalInstance;
      "function" === typeof ctor.getDerivedStateFromProps &&
        null === addendum &&
        ((addendum = getComponentNameFromType(ctor) || "Component"),
        didWarnAboutUninitializedState.has(addendum) ||
          (didWarnAboutUninitializedState.add(addendum),
          error$jscomp$0(
            "`%s` uses `getDerivedStateFromProps` but its initial state is %s. This is not recommended. Instead, define the initial state by assigning an object to `this.state` in the constructor of `%s`. This ensures that `getDerivedStateFromProps` arguments have a consistent shape.",
            addendum,
            null === props.state ? "null" : "undefined",
            addendum
          )));
      if (
        "function" === typeof ctor.getDerivedStateFromProps ||
        "function" === typeof props.getSnapshotBeforeUpdate
      ) {
        var foundWillReceivePropsName = (addendum = null),
          foundWillUpdateName = null;
        "function" === typeof props.componentWillMount &&
        !0 !== props.componentWillMount.__suppressDeprecationWarning
          ? (addendum = "componentWillMount")
          : "function" === typeof props.UNSAFE_componentWillMount &&
            (addendum = "UNSAFE_componentWillMount");
        "function" === typeof props.componentWillReceiveProps &&
        !0 !== props.componentWillReceiveProps.__suppressDeprecationWarning
          ? (foundWillReceivePropsName = "componentWillReceiveProps")
          : "function" === typeof props.UNSAFE_componentWillReceiveProps &&
            (foundWillReceivePropsName = "UNSAFE_componentWillReceiveProps");
        "function" === typeof props.componentWillUpdate &&
        !0 !== props.componentWillUpdate.__suppressDeprecationWarning
          ? (foundWillUpdateName = "componentWillUpdate")
          : "function" === typeof props.UNSAFE_componentWillUpdate &&
            (foundWillUpdateName = "UNSAFE_componentWillUpdate");
        if (
          null !== addendum ||
          null !== foundWillReceivePropsName ||
          null !== foundWillUpdateName
        ) {
          var _componentName = getComponentNameFromType(ctor) || "Component";
          ctor =
            "function" === typeof ctor.getDerivedStateFromProps
              ? "getDerivedStateFromProps()"
              : "getSnapshotBeforeUpdate()";
          didWarnAboutLegacyLifecyclesAndDerivedState.has(_componentName) ||
            (didWarnAboutLegacyLifecyclesAndDerivedState.add(_componentName),
            error$jscomp$0(
              "Unsafe legacy lifecycles will not be called for components using new component APIs.\n\n%s uses %s but also contains the following legacy lifecycles:%s%s%s\n\nThe above lifecycles should be removed. Learn more about this warning here:\nhttps://react.dev/link/unsafe-component-lifecycles",
              _componentName,
              ctor,
              null !== addendum ? "\n  " + addendum : "",
              null !== foundWillReceivePropsName
                ? "\n  " + foundWillReceivePropsName
                : "",
              null !== foundWillUpdateName ? "\n  " + foundWillUpdateName : ""
            ));
        }
      }
      isLegacyContextConsumer &&
        ((workInProgress = workInProgress.stateNode),
        (workInProgress.__reactInternalMemoizedUnmaskedChildContext =
          unmaskedContext),
        (workInProgress.__reactInternalMemoizedMaskedChildContext = context));
      return props;
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
          error$jscomp$0(
            "%s.componentWillReceiveProps(): Assigning directly to this.state is deprecated (except inside a component's constructor). Use setState instead.",
            workInProgress
          )),
        classComponentUpdater.enqueueReplaceState(
          instance,
          instance.state,
          null
        ));
    }
    function mountClassInstance(workInProgress, ctor, newProps, renderLanes) {
      var instance = workInProgress.stateNode,
        name = getComponentNameFromType(ctor) || "Component";
      instance.render ||
        (ctor.prototype && "function" === typeof ctor.prototype.render
          ? error$jscomp$0(
              "No `render` method found on the %s instance: did you accidentally return an object from the constructor?",
              name
            )
          : error$jscomp$0(
              "No `render` method found on the %s instance: you may have forgotten to define `render`.",
              name
            ));
      !instance.getInitialState ||
        instance.getInitialState.isReactClassApproved ||
        instance.state ||
        error$jscomp$0(
          "getInitialState was defined on %s, a plain JavaScript class. This is only supported for classes created using React.createClass. Did you mean to define a state property instead?",
          name
        );
      instance.getDefaultProps &&
        !instance.getDefaultProps.isReactClassApproved &&
        error$jscomp$0(
          "getDefaultProps was defined on %s, a plain JavaScript class. This is only supported for classes created using React.createClass. Use a static property to define defaultProps instead.",
          name
        );
      instance.contextType &&
        error$jscomp$0(
          "contextType was defined as an instance property on %s. Use a static property to define contextType instead.",
          name
        );
      instance.contextTypes &&
        error$jscomp$0(
          "contextTypes was defined as an instance property on %s. Use a static property to define contextTypes instead.",
          name
        );
      ctor.contextType &&
        ctor.contextTypes &&
        !didWarnAboutContextTypeAndContextTypes.has(ctor) &&
        (didWarnAboutContextTypeAndContextTypes.add(ctor),
        error$jscomp$0(
          "%s declares both contextTypes and contextType static properties. The legacy contextTypes property will be ignored.",
          name
        ));
      ctor.childContextTypes &&
        !didWarnAboutChildContextTypes.has(ctor) &&
        (didWarnAboutChildContextTypes.add(ctor),
        error$jscomp$0(
          "%s uses the legacy childContextTypes API which will soon be removed. Use React.createContext() instead. (https://react.dev/link/legacy-context)",
          name
        ));
      ctor.contextTypes &&
        !didWarnAboutContextTypes$1.has(ctor) &&
        (didWarnAboutContextTypes$1.add(ctor),
        error$jscomp$0(
          "%s uses the legacy contextTypes API which will soon be removed. Use React.createContext() with static contextType instead. (https://react.dev/link/legacy-context)",
          name
        ));
      "function" === typeof instance.componentShouldUpdate &&
        error$jscomp$0(
          "%s has a method called componentShouldUpdate(). Did you mean shouldComponentUpdate()? The name is phrased as a question because the function is expected to return a value.",
          name
        );
      ctor.prototype &&
        ctor.prototype.isPureReactComponent &&
        "undefined" !== typeof instance.shouldComponentUpdate &&
        error$jscomp$0(
          "%s has a method called shouldComponentUpdate(). shouldComponentUpdate should not be used when extending React.PureComponent. Please extend React.Component if shouldComponentUpdate is used.",
          getComponentNameFromType(ctor) || "A pure component"
        );
      "function" === typeof instance.componentDidUnmount &&
        error$jscomp$0(
          "%s has a method called componentDidUnmount(). But there is no such lifecycle method. Did you mean componentWillUnmount()?",
          name
        );
      "function" === typeof instance.componentDidReceiveProps &&
        error$jscomp$0(
          "%s has a method called componentDidReceiveProps(). But there is no such lifecycle method. If you meant to update the state in response to changing props, use componentWillReceiveProps(). If you meant to fetch data or run side-effects or mutations after React has updated the UI, use componentDidUpdate().",
          name
        );
      "function" === typeof instance.componentWillRecieveProps &&
        error$jscomp$0(
          "%s has a method called componentWillRecieveProps(). Did you mean componentWillReceiveProps()?",
          name
        );
      "function" === typeof instance.UNSAFE_componentWillRecieveProps &&
        error$jscomp$0(
          "%s has a method called UNSAFE_componentWillRecieveProps(). Did you mean UNSAFE_componentWillReceiveProps()?",
          name
        );
      var hasMutatedProps = instance.props !== newProps;
      void 0 !== instance.props &&
        hasMutatedProps &&
        error$jscomp$0(
          "When calling super() in `%s`, make sure to pass up the same props that your component's constructor was passed.",
          name
        );
      instance.defaultProps &&
        error$jscomp$0(
          "Setting defaultProps as an instance property on %s is not supported and will be ignored. Instead, define defaultProps as a static property on %s.",
          name,
          name
        );
      "function" !== typeof instance.getSnapshotBeforeUpdate ||
        "function" === typeof instance.componentDidUpdate ||
        didWarnAboutGetSnapshotBeforeUpdateWithoutDidUpdate.has(ctor) ||
        (didWarnAboutGetSnapshotBeforeUpdateWithoutDidUpdate.add(ctor),
        error$jscomp$0(
          "%s: getSnapshotBeforeUpdate() should be used with componentDidUpdate(). This component defines getSnapshotBeforeUpdate() only.",
          getComponentNameFromType(ctor)
        ));
      "function" === typeof instance.getDerivedStateFromProps &&
        error$jscomp$0(
          "%s: getDerivedStateFromProps() is defined as an instance method and will be ignored. Instead, declare it as a static method.",
          name
        );
      "function" === typeof instance.getDerivedStateFromError &&
        error$jscomp$0(
          "%s: getDerivedStateFromError() is defined as an instance method and will be ignored. Instead, declare it as a static method.",
          name
        );
      "function" === typeof ctor.getSnapshotBeforeUpdate &&
        error$jscomp$0(
          "%s: getSnapshotBeforeUpdate() is defined as a static method and will be ignored. Instead, declare it as an instance method.",
          name
        );
      (hasMutatedProps = instance.state) &&
        ("object" !== typeof hasMutatedProps || isArrayImpl(hasMutatedProps)) &&
        error$jscomp$0("%s.state: must be set to an object or null", name);
      "function" === typeof instance.getChildContext &&
        "object" !== typeof ctor.childContextTypes &&
        error$jscomp$0(
          "%s.getChildContext(): childContextTypes must be defined in order to use getChildContext().",
          name
        );
      instance = workInProgress.stateNode;
      instance.props = newProps;
      instance.state = workInProgress.memoizedState;
      instance.refs = {};
      initializeUpdateQueue(workInProgress);
      name = ctor.contextType;
      "object" === typeof name && null !== name
        ? (instance.context = readContext(name))
        : ((name = isContextProvider(ctor)
            ? previousContext
            : contextStackCursor$1.current),
          (instance.context = getMaskedContext(workInProgress, name)));
      instance.state === newProps &&
        ((name = getComponentNameFromType(ctor) || "Component"),
        didWarnAboutDirectlyAssigningPropsToState.has(name) ||
          (didWarnAboutDirectlyAssigningPropsToState.add(name),
          error$jscomp$0(
            "%s: It is not recommended to assign props directly to state because updates to props won't be reflected in state. In most cases, it is better to use props directly.",
            name
          )));
      workInProgress.mode & 8 &&
        ReactStrictModeWarnings.recordLegacyContextWarning(
          workInProgress,
          instance
        );
      ReactStrictModeWarnings.recordUnsafeLifecycleWarnings(
        workInProgress,
        instance
      );
      instance.state = workInProgress.memoizedState;
      name = ctor.getDerivedStateFromProps;
      "function" === typeof name &&
        (applyDerivedStateFromProps(workInProgress, ctor, name, newProps),
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
          (error$jscomp$0(
            "%s.componentWillMount(): Assigning directly to this.state is deprecated (except inside a component's constructor). Use setState instead.",
            getComponentNameFromFiber(workInProgress) || "Component"
          ),
          classComponentUpdater.enqueueReplaceState(
            instance,
            instance.state,
            null
          )),
        processUpdateQueue(workInProgress, newProps, instance, renderLanes),
        suspendIfUpdateReadFromEntangledAsyncAction(),
        (instance.state = workInProgress.memoizedState));
      "function" === typeof instance.componentDidMount &&
        (workInProgress.flags |= 4194308);
      0 !== (workInProgress.mode & 16) && (workInProgress.flags |= 67108864);
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
    function defaultOnUncaughtError(error, errorInfo) {
      reportGlobalError(error);
      error = componentName
        ? "An error occurred in the <" + componentName + "> component."
        : "An error occurred in one of your React components.";
      var prevGetCurrentStack = ReactSharedInternals.getCurrentStack,
        componentStack =
          null != errorInfo.componentStack ? errorInfo.componentStack : "";
      ReactSharedInternals.getCurrentStack = function () {
        return componentStack;
      };
      try {
        warn(
          "%s\n\n%s\n",
          error,
          "Consider adding an error boundary to your tree to customize error handling behavior.\nVisit https://react.dev/link/error-boundaries to learn more about error boundaries."
        );
      } finally {
        ReactSharedInternals.getCurrentStack = prevGetCurrentStack;
      }
    }
    function defaultOnCaughtError(error$1, errorInfo) {
      var componentNameMessage = componentName
          ? "The above error occurred in the <" + componentName + "> component."
          : "The above error occurred in one of your React components.",
        recreateMessage =
          "React will try to recreate this component tree from scratch using the error boundary you provided, " +
          ((errorBoundaryName || "Anonymous") + "."),
        prevGetCurrentStack = ReactSharedInternals.getCurrentStack,
        componentStack =
          null != errorInfo.componentStack ? errorInfo.componentStack : "";
      ReactSharedInternals.getCurrentStack = function () {
        return componentStack;
      };
      try {
        "object" === typeof error$1 &&
        null !== error$1 &&
        "string" === typeof error$1.environmentName
          ? bindToConsole(
              "error",
              [
                "%o\n\n%s\n\n%s\n",
                error$1,
                componentNameMessage,
                recreateMessage
              ],
              error$1.environmentName
            )()
          : error$jscomp$0(
              "%o\n\n%s\n\n%s\n",
              error$1,
              componentNameMessage,
              recreateMessage
            );
      } finally {
        ReactSharedInternals.getCurrentStack = prevGetCurrentStack;
      }
    }
    function defaultOnRecoverableError(error) {
      reportGlobalError(error);
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
        var error$1 = errorInfo.value;
        update.payload = function () {
          return getDerivedStateFromError(error$1);
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
              error$jscomp$0(
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
            case 13:
              return (
                sourceFiber.mode & 1 &&
                  (null === shellBoundary
                    ? renderDidSuspendDelayIfPossible()
                    : null === currentSourceFiber.alternate &&
                      workInProgressRootExitStatus === RootInProgress &&
                      (workInProgressRootExitStatus = RootSuspended)),
                (currentSourceFiber.flags &= -257),
                0 === (currentSourceFiber.mode & 1)
                  ? currentSourceFiber === returnFiber
                    ? (currentSourceFiber.flags |= 65536)
                    : ((currentSourceFiber.flags |= 128),
                      (sourceFiber.flags |= 131072),
                      (sourceFiber.flags &= -52805),
                      1 === sourceFiber.tag
                        ? null === sourceFiber.alternate
                          ? (sourceFiber.tag = 17)
                          : ((returnFiber = createUpdate(2)),
                            (returnFiber.tag = ForceUpdate),
                            enqueueUpdate(sourceFiber, returnFiber, 2))
                        : 0 === sourceFiber.tag &&
                          null === sourceFiber.alternate &&
                          (sourceFiber.tag = 28),
                      (sourceFiber.lanes |= 2))
                  : ((currentSourceFiber.flags |= 65536),
                    (currentSourceFiber.lanes = rootRenderLanes)),
                value === noopSuspenseyCommitThenable
                  ? (currentSourceFiber.flags |= 16384)
                  : ((returnFiber = currentSourceFiber.updateQueue),
                    null === returnFiber
                      ? (currentSourceFiber.updateQueue = new Set([value]))
                      : returnFiber.add(value),
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
                    : ((returnFiber = currentSourceFiber.updateQueue),
                      null === returnFiber
                        ? ((returnFiber = {
                            transitions: null,
                            markerInstances: null,
                            retryQueue: new Set([value])
                          }),
                          (currentSourceFiber.updateQueue = returnFiber))
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
              currentSourceFiber.tag +
              "). This is a bug in React."
          );
        }
        if (1 === root.tag)
          return (
            attachPingListener(root, value, rootRenderLanes),
            renderDidSuspendDelayIfPossible(),
            !1
          );
        value = Error(
          "A component suspended while responding to synchronous input. This will cause the UI to be replaced with a loading indicator. To fix, updates that suspend should be wrapped with startTransition."
        );
      }
      currentSourceFiber = createCapturedValueAtFiber(
        Error(
          "There was an error during concurrent rendering but React was able to recover by instead synchronously rendering the entire root.",
          { cause: value }
        ),
        sourceFiber
      );
      null === workInProgressRootConcurrentErrors
        ? (workInProgressRootConcurrentErrors = [currentSourceFiber])
        : workInProgressRootConcurrentErrors.push(currentSourceFiber);
      workInProgressRootExitStatus !== RootSuspendedWithDelay &&
        (workInProgressRootExitStatus = RootErrored);
      if (null === returnFiber) return !0;
      value = createCapturedValueAtFiber(value, sourceFiber);
      do {
        switch (returnFiber.tag) {
          case 3:
            return (
              (returnFiber.flags |= 65536),
              (root = rootRenderLanes & -rootRenderLanes),
              (returnFiber.lanes |= root),
              (root = createRootErrorUpdate(
                returnFiber.stateNode,
                value,
                root
              )),
              enqueueCapturedUpdate(returnFiber, root),
              !1
            );
          case 1:
            if (
              ((sourceFiber = returnFiber.type),
              (currentSourceFiber = returnFiber.stateNode),
              0 === (returnFiber.flags & 128) &&
                ("function" === typeof sourceFiber.getDerivedStateFromError ||
                  (null !== currentSourceFiber &&
                    "function" ===
                      typeof currentSourceFiber.componentDidCatch &&
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
                  value
                ),
                enqueueCapturedUpdate(returnFiber, rootRenderLanes),
                !1
              );
        }
        returnFiber = returnFiber.return;
      } while (null !== returnFiber);
      return !1;
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
      markComponentRenderStarted(workInProgress);
      nextProps = renderWithHooks(
        current,
        workInProgress,
        Component,
        propsWithoutRef,
        ref,
        renderLanes
      );
      markComponentRenderStopped();
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
    function updateOffscreenComponent(current, workInProgress, renderLanes) {
      var nextProps = workInProgress.pendingProps,
        nextChildren = nextProps.children,
        nextIsDetached =
          0 !== (workInProgress.stateNode._pendingVisibility & 2),
        prevState = null !== current ? current.memoizedState : null;
      markRef(current, workInProgress);
      if ("hidden" === nextProps.mode || nextIsDetached) {
        if (0 !== (workInProgress.flags & 128)) {
          nextProps =
            null !== prevState
              ? prevState.baseLanes | renderLanes
              : renderLanes;
          if (null !== current) {
            nextChildren = workInProgress.child = current.child;
            for (nextIsDetached = 0; null !== nextChildren; )
              (nextIsDetached =
                nextIsDetached | nextChildren.lanes | nextChildren.childLanes),
                (nextChildren = nextChildren.sibling);
            workInProgress.childLanes = nextIsDetached & ~nextProps;
          } else (workInProgress.childLanes = 0), (workInProgress.child = null);
          return deferHiddenOffscreenComponent(
            current,
            workInProgress,
            nextProps,
            renderLanes
          );
        }
        if (0 === (workInProgress.mode & 1))
          (workInProgress.memoizedState = { baseLanes: 0, cachePool: null }),
            null !== current && pushTransition(workInProgress, null),
            reuseHiddenContextOnStack(workInProgress),
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
              : reuseHiddenContextOnStack(workInProgress),
            pushOffscreenSuspenseHandler(workInProgress);
        else
          return (
            (workInProgress.lanes = workInProgress.childLanes = 536870912),
            deferHiddenOffscreenComponent(
              current,
              workInProgress,
              null !== prevState
                ? prevState.baseLanes | renderLanes
                : renderLanes,
              renderLanes
            )
          );
      } else
        null !== prevState
          ? (pushTransition(workInProgress, prevState.cachePool),
            pushHiddenContext(workInProgress, prevState),
            reuseSuspenseHandlerOnStack(workInProgress),
            (workInProgress.memoizedState = null))
          : (null !== current && pushTransition(workInProgress, null),
            reuseHiddenContextOnStack(workInProgress),
            reuseSuspenseHandlerOnStack(workInProgress));
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
          : {
              parent: CacheContext._currentValue2,
              pool: JSCompiler_inline_result
            };
      workInProgress.memoizedState = {
        baseLanes: nextBaseLanes,
        cachePool: JSCompiler_inline_result
      };
      null !== current && pushTransition(workInProgress, null);
      reuseHiddenContextOnStack(workInProgress);
      pushOffscreenSuspenseHandler(workInProgress);
      null !== current &&
        propagateParentContextChanges(current, workInProgress, renderLanes, !0);
      return null;
    }
    function markRef(current, workInProgress) {
      var ref = workInProgress.ref;
      if (null === ref)
        null !== current &&
          null !== current.ref &&
          (workInProgress.flags |= 2097664);
      else {
        if ("function" !== typeof ref && "object" !== typeof ref)
          throw Error(
            "Expected ref to be a function, an object returned by React.createRef(), or undefined/null."
          );
        if (null === current || current.ref !== ref)
          workInProgress.flags |= 2097664;
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
          (error$jscomp$0(
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
            error$jscomp$0(
              "%s uses the legacy contextTypes API which will be removed soon. Use React.createContext() with React.useContext() instead. (https://react.dev/link/legacy-context)",
              componentName
            ))));
      componentName = isContextProvider(Component)
        ? previousContext
        : contextStackCursor$1.current;
      componentName = getMaskedContext(workInProgress, componentName);
      prepareToReadContext(workInProgress);
      markComponentRenderStarted(workInProgress);
      Component = renderWithHooks(
        current,
        workInProgress,
        Component,
        nextProps,
        componentName,
        renderLanes
      );
      markComponentRenderStopped();
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
      secondArg,
      renderLanes
    ) {
      prepareToReadContext(workInProgress);
      markComponentRenderStarted(workInProgress);
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
      markComponentRenderStopped();
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
      isContextProvider(Component)
        ? ((_instance = !0), pushContextProvider(workInProgress))
        : (_instance = !1);
      prepareToReadContext(workInProgress);
      if (null === workInProgress.stateNode)
        resetSuspendedCurrentOnMountInLegacyMode(current, workInProgress),
          constructClassInstance(workInProgress, Component, nextProps),
          mountClassInstance(workInProgress, Component, nextProps, renderLanes),
          (state = !0);
      else if (null === current) {
        state = workInProgress.stateNode;
        var unresolvedOldProps = workInProgress.memoizedProps;
        lane = resolveClassComponentProps(Component, unresolvedOldProps);
        state.props = lane;
        var oldContext = state.context,
          contextType = Component.contextType;
        "object" === typeof contextType && null !== contextType
          ? (contextType = readContext(contextType))
          : ((contextType = isContextProvider(Component)
              ? previousContext
              : contextStackCursor$1.current),
            (contextType = getMaskedContext(workInProgress, contextType)));
        var getDerivedStateFromProps = Component.getDerivedStateFromProps,
          hasNewLifecycles =
            "function" === typeof getDerivedStateFromProps ||
            "function" === typeof state.getSnapshotBeforeUpdate;
        unresolvedOldProps = workInProgress.pendingProps !== unresolvedOldProps;
        hasNewLifecycles ||
          ("function" !== typeof state.UNSAFE_componentWillReceiveProps &&
            "function" !== typeof state.componentWillReceiveProps) ||
          ((unresolvedOldProps || oldContext !== contextType) &&
            callComponentWillReceiveProps(
              workInProgress,
              state,
              nextProps,
              contextType
            ));
        hasForceUpdate = !1;
        var oldState = workInProgress.memoizedState;
        state.state = oldState;
        processUpdateQueue(workInProgress, nextProps, state, renderLanes);
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
            (lane =
              hasForceUpdate ||
              checkShouldComponentUpdate(
                workInProgress,
                Component,
                lane,
                nextProps,
                oldState,
                oldContext,
                contextType
              ))
              ? (hasNewLifecycles ||
                  ("function" !== typeof state.UNSAFE_componentWillMount &&
                    "function" !== typeof state.componentWillMount) ||
                  ("function" === typeof state.componentWillMount &&
                    state.componentWillMount(),
                  "function" === typeof state.UNSAFE_componentWillMount &&
                    state.UNSAFE_componentWillMount()),
                "function" === typeof state.componentDidMount &&
                  (workInProgress.flags |= 4194308),
                0 !== (workInProgress.mode & 16) &&
                  (workInProgress.flags |= 67108864))
              : ("function" === typeof state.componentDidMount &&
                  (workInProgress.flags |= 4194308),
                0 !== (workInProgress.mode & 16) &&
                  (workInProgress.flags |= 67108864),
                (workInProgress.memoizedProps = nextProps),
                (workInProgress.memoizedState = oldContext)),
            (state.props = nextProps),
            (state.state = oldContext),
            (state.context = contextType),
            (state = lane))
          : ("function" === typeof state.componentDidMount &&
              (workInProgress.flags |= 4194308),
            0 !== (workInProgress.mode & 16) &&
              (workInProgress.flags |= 67108864),
            (state = !1));
      } else {
        state = workInProgress.stateNode;
        cloneUpdateQueue(current, workInProgress);
        lane = workInProgress.memoizedProps;
        contextType = resolveClassComponentProps(Component, lane);
        state.props = contextType;
        hasNewLifecycles = workInProgress.pendingProps;
        unresolvedOldProps = state.context;
        oldContext = Component.contextType;
        "object" === typeof oldContext && null !== oldContext
          ? (oldContext = readContext(oldContext))
          : ((oldContext = isContextProvider(Component)
              ? previousContext
              : contextStackCursor$1.current),
            (oldContext = getMaskedContext(workInProgress, oldContext)));
        oldState = Component.getDerivedStateFromProps;
        (getDerivedStateFromProps =
          "function" === typeof oldState ||
          "function" === typeof state.getSnapshotBeforeUpdate) ||
          ("function" !== typeof state.UNSAFE_componentWillReceiveProps &&
            "function" !== typeof state.componentWillReceiveProps) ||
          ((lane !== hasNewLifecycles || unresolvedOldProps !== oldContext) &&
            callComponentWillReceiveProps(
              workInProgress,
              state,
              nextProps,
              oldContext
            ));
        hasForceUpdate = !1;
        unresolvedOldProps = workInProgress.memoizedState;
        state.state = unresolvedOldProps;
        processUpdateQueue(workInProgress, nextProps, state, renderLanes);
        suspendIfUpdateReadFromEntangledAsyncAction();
        var newState = workInProgress.memoizedState;
        lane !== hasNewLifecycles ||
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
                  ("function" !== typeof state.UNSAFE_componentWillUpdate &&
                    "function" !== typeof state.componentWillUpdate) ||
                  ("function" === typeof state.componentWillUpdate &&
                    state.componentWillUpdate(nextProps, newState, oldContext),
                  "function" === typeof state.UNSAFE_componentWillUpdate &&
                    state.UNSAFE_componentWillUpdate(
                      nextProps,
                      newState,
                      oldContext
                    )),
                "function" === typeof state.componentDidUpdate &&
                  (workInProgress.flags |= 4),
                "function" === typeof state.getSnapshotBeforeUpdate &&
                  (workInProgress.flags |= 1024))
              : ("function" !== typeof state.componentDidUpdate ||
                  (lane === current.memoizedProps &&
                    unresolvedOldProps === current.memoizedState) ||
                  (workInProgress.flags |= 4),
                "function" !== typeof state.getSnapshotBeforeUpdate ||
                  (lane === current.memoizedProps &&
                    unresolvedOldProps === current.memoizedState) ||
                  (workInProgress.flags |= 1024),
                (workInProgress.memoizedProps = nextProps),
                (workInProgress.memoizedState = newState)),
            (state.props = nextProps),
            (state.state = newState),
            (state.context = oldContext),
            (state = contextType))
          : ("function" !== typeof state.componentDidUpdate ||
              (lane === current.memoizedProps &&
                unresolvedOldProps === current.memoizedState) ||
              (workInProgress.flags |= 4),
            "function" !== typeof state.getSnapshotBeforeUpdate ||
              (lane === current.memoizedProps &&
                unresolvedOldProps === current.memoizedState) ||
              (workInProgress.flags |= 1024),
            (state = !1));
      }
      current = finishClassComponent(
        current,
        workInProgress,
        Component,
        state,
        _instance,
        renderLanes
      );
      Component = workInProgress.stateNode;
      state &&
        Component.props !== nextProps &&
        (didWarnAboutReassigningProps ||
          error$jscomp$0(
            "It looks like %s is reassigning its own `this.props` while rendering. This is not supported and can lead to confusing bugs.",
            getComponentNameFromFiber(workInProgress) || "a component"
          ),
        (didWarnAboutReassigningProps = !0));
      return current;
    }
    function finishClassComponent(
      current$jscomp$0,
      workInProgress,
      Component,
      shouldUpdate,
      hasContext,
      renderLanes
    ) {
      markRef(current$jscomp$0, workInProgress);
      var didCaptureError = 0 !== (workInProgress.flags & 128);
      if (!shouldUpdate && !didCaptureError)
        return (
          hasContext &&
            invalidateContextProvider(workInProgress, Component, !1),
          bailoutOnAlreadyFinishedWork(
            current$jscomp$0,
            workInProgress,
            renderLanes
          )
        );
      shouldUpdate = workInProgress.stateNode;
      ReactSharedInternals.getCurrentStack =
        null === workInProgress ? null : getCurrentFiberStackInDev;
      isRendering = !1;
      current = workInProgress;
      if (
        didCaptureError &&
        "function" !== typeof Component.getDerivedStateFromError
      ) {
        var nextChildren = null;
        profilerStartTime = -1;
      } else
        markComponentRenderStarted(workInProgress),
          (nextChildren = callRenderInDEV(shouldUpdate)),
          markComponentRenderStopped();
      workInProgress.flags |= 1;
      null !== current$jscomp$0 && didCaptureError
        ? ((didCaptureError = nextChildren),
          (workInProgress.child = reconcileChildFibers(
            workInProgress,
            current$jscomp$0.child,
            null,
            renderLanes
          )),
          (workInProgress.child = reconcileChildFibers(
            workInProgress,
            null,
            didCaptureError,
            renderLanes
          )))
        : reconcileChildren(
            current$jscomp$0,
            workInProgress,
            nextChildren,
            renderLanes
          );
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
    function validateFunctionComponentInDev(workInProgress, Component) {
      Component &&
        Component.childContextTypes &&
        error$jscomp$0(
          "childContextTypes cannot be defined on a function component.\n  %s.childContextTypes = ...",
          Component.displayName || Component.name || "Component"
        );
      "function" === typeof Component.getDerivedStateFromProps &&
        ((workInProgress = getComponentNameFromType(Component) || "Unknown"),
        didWarnAboutGetDerivedStateOnFunctionComponent[workInProgress] ||
          (error$jscomp$0(
            "%s: Function components do not support getDerivedStateFromProps.",
            workInProgress
          ),
          (didWarnAboutGetDerivedStateOnFunctionComponent[workInProgress] =
            !0)));
      "object" === typeof Component.contextType &&
        null !== Component.contextType &&
        ((Component = getComponentNameFromType(Component) || "Unknown"),
        didWarnAboutContextTypeOnFunctionComponent[Component] ||
          (error$jscomp$0(
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
        var nextPrimaryChildren = nextProps.children;
        didSuspend = nextProps.fallback;
        if (showFallback)
          return (
            reuseSuspenseHandlerOnStack(workInProgress),
            (nextProps = mountSuspenseFallbackChildren(
              workInProgress,
              nextPrimaryChildren,
              didSuspend,
              renderLanes
            )),
            (nextPrimaryChildren = workInProgress.child),
            (nextPrimaryChildren.memoizedState =
              mountSuspenseOffscreenState(renderLanes)),
            (nextPrimaryChildren.childLanes = getRemainingWorkInPrimaryTree(
              current,
              JSCompiler_temp,
              renderLanes
            )),
            (workInProgress.memoizedState = SUSPENDED_MARKER),
            nextProps
          );
        if ("number" === typeof nextProps.unstable_expectedLoadTime)
          return (
            reuseSuspenseHandlerOnStack(workInProgress),
            (nextProps = mountSuspenseFallbackChildren(
              workInProgress,
              nextPrimaryChildren,
              didSuspend,
              renderLanes
            )),
            (nextPrimaryChildren = workInProgress.child),
            (nextPrimaryChildren.memoizedState =
              mountSuspenseOffscreenState(renderLanes)),
            (nextPrimaryChildren.childLanes = getRemainingWorkInPrimaryTree(
              current,
              JSCompiler_temp,
              renderLanes
            )),
            (workInProgress.memoizedState = SUSPENDED_MARKER),
            (workInProgress.lanes = 4194304),
            nextProps
          );
        pushPrimaryTreeSuspenseHandler(workInProgress);
        return mountSuspensePrimaryChildren(
          workInProgress,
          nextPrimaryChildren
        );
      }
      nextPrimaryChildren = current.memoizedState;
      if (
        null !== nextPrimaryChildren &&
        null !== nextPrimaryChildren.dehydrated
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
                (nextProps = createFiberFromOffscreen(
                  { mode: "visible", children: nextProps.children },
                  showFallback,
                  0,
                  null
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
                (workInProgress = nextPrimaryChildren));
        else if (
          (pushPrimaryTreeSuspenseHandler(workInProgress),
          isSuspenseInstanceFallback())
        )
          (showFallback = getSuspenseInstanceFallbackErrorDetails()),
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
            "string" === typeof JSCompiler_temp &&
              CapturedStacks.set(nextPrimaryChildren, JSCompiler_temp),
            (JSCompiler_temp = {
              value: nextPrimaryChildren,
              source: null,
              stack: JSCompiler_temp
            }),
            null === hydrationErrors
              ? (hydrationErrors = [JSCompiler_temp])
              : hydrationErrors.push(JSCompiler_temp),
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
          if (null !== JSCompiler_temp) {
            nextProps = renderLanes & -renderLanes;
            if (0 !== (nextProps & 42)) nextProps = 1;
            else
              switch (nextProps) {
                case 2:
                  nextProps = 1;
                  break;
                case 8:
                  nextProps = 4;
                  break;
                case 32:
                  nextProps = 16;
                  break;
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
                  nextProps = 64;
                  break;
                case 268435456:
                  nextProps = 134217728;
                  break;
                default:
                  nextProps = 0;
              }
            nextProps =
              0 !== (nextProps & (JSCompiler_temp.suspendedLanes | renderLanes))
                ? 0
                : nextProps;
            if (0 !== nextProps && nextProps !== nextPrimaryChildren.retryLane)
              throw (
                ((nextPrimaryChildren.retryLane = nextProps),
                enqueueConcurrentRenderForLane(current, nextProps),
                scheduleUpdateOnFiber(JSCompiler_temp, current, nextProps),
                SelectiveHydrationException)
              );
          }
          isSuspenseInstancePending() || renderDidSuspendDelayIfPossible();
          workInProgress = retrySuspenseComponentWithoutHydrating(
            current,
            workInProgress,
            renderLanes
          );
        } else
          isSuspenseInstancePending()
            ? ((workInProgress.flags |= 128),
              (workInProgress.child = current.child),
              retryDehydratedSuspenseBoundary.bind(null, current),
              registerSuspenseInstanceRetry(),
              (workInProgress = null))
            : ((workInProgress = mountSuspensePrimaryChildren(
                workInProgress,
                nextProps.children
              )),
              (workInProgress.flags |= 4096));
        return workInProgress;
      }
      if (showFallback) {
        reuseSuspenseHandlerOnStack(workInProgress);
        nextPrimaryChildren = nextProps.fallback;
        showFallback = workInProgress.mode;
        didSuspend = current.child;
        var currentFallbackChildFragment = didSuspend.sibling,
          primaryChildProps = { mode: "hidden", children: nextProps.children };
        0 === (showFallback & 1) && workInProgress.child !== didSuspend
          ? ((nextProps = workInProgress.child),
            (nextProps.childLanes = 0),
            (nextProps.pendingProps = primaryChildProps),
            workInProgress.mode & 2 &&
              ((nextProps.actualDuration = -0),
              (nextProps.actualStartTime = -1.1),
              (nextProps.selfBaseDuration = didSuspend.selfBaseDuration),
              (nextProps.treeBaseDuration = didSuspend.treeBaseDuration)),
            (workInProgress.deletions = null))
          : ((nextProps = createWorkInProgress(didSuspend, primaryChildProps)),
            (nextProps.subtreeFlags = didSuspend.subtreeFlags & 31457280));
        null !== currentFallbackChildFragment
          ? (nextPrimaryChildren = createWorkInProgress(
              currentFallbackChildFragment,
              nextPrimaryChildren
            ))
          : ((nextPrimaryChildren = createFiberFromFragment(
              nextPrimaryChildren,
              showFallback,
              renderLanes,
              null
            )),
            (nextPrimaryChildren.flags |= 2));
        nextPrimaryChildren.return = workInProgress;
        nextProps.return = workInProgress;
        nextProps.sibling = nextPrimaryChildren;
        workInProgress.child = nextProps;
        nextProps = nextPrimaryChildren;
        nextPrimaryChildren = workInProgress.child;
        showFallback = current.child.memoizedState;
        null === showFallback
          ? (showFallback = mountSuspenseOffscreenState(renderLanes))
          : ((didSuspend = showFallback.cachePool),
            null !== didSuspend
              ? ((currentFallbackChildFragment = CacheContext._currentValue2),
                (didSuspend =
                  didSuspend.parent !== currentFallbackChildFragment
                    ? {
                        parent: currentFallbackChildFragment,
                        pool: currentFallbackChildFragment
                      }
                    : didSuspend))
              : (didSuspend = getSuspendedCache()),
            (showFallback = {
              baseLanes: showFallback.baseLanes | renderLanes,
              cachePool: didSuspend
            }));
        nextPrimaryChildren.memoizedState = showFallback;
        nextPrimaryChildren.childLanes = getRemainingWorkInPrimaryTree(
          current,
          JSCompiler_temp,
          renderLanes
        );
        workInProgress.memoizedState = SUSPENDED_MARKER;
        return nextProps;
      }
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
          ? ((workInProgress.deletions = [current]),
            (workInProgress.flags |= 16))
          : renderLanes.push(current));
      workInProgress.child = JSCompiler_temp;
      workInProgress.memoizedState = null;
      return JSCompiler_temp;
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
          (progressedPrimaryFragment.pendingProps = primaryChildren),
          workInProgress.mode & 2 &&
            ((progressedPrimaryFragment.actualDuration = -0),
            (progressedPrimaryFragment.actualStartTime = -1.1),
            (progressedPrimaryFragment.selfBaseDuration = -0),
            (progressedPrimaryFragment.treeBaseDuration = -0)))
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
    function validateSuspenseListNestedChild(childSlot, index) {
      var isAnArray = isArrayImpl(childSlot);
      childSlot = !isAnArray && "function" === typeof getIteratorFn(childSlot);
      return isAnArray || childSlot
        ? ((isAnArray = isAnArray ? "array" : "iterable"),
          error$jscomp$0(
            "A nested %s was passed to row #%s in <SuspenseList />. Wrap it in an additional SuspenseList to configure its revealOrder: <SuspenseList revealOrder=...> ... <SuspenseList revealOrder=...>{%s}</SuspenseList> ... </SuspenseList>",
            isAnArray,
            index,
            isAnArray
          ),
          !1)
        : !0;
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
      nextProps = nextProps.children;
      if (
        void 0 !== revealOrder &&
        "forwards" !== revealOrder &&
        "backwards" !== revealOrder &&
        "together" !== revealOrder &&
        !didWarnAboutRevealOrder[revealOrder]
      )
        if (
          ((didWarnAboutRevealOrder[revealOrder] = !0),
          "string" === typeof revealOrder)
        )
          switch (revealOrder.toLowerCase()) {
            case "together":
            case "forwards":
            case "backwards":
              error$jscomp$0(
                '"%s" is not a valid value for revealOrder on <SuspenseList />. Use lowercase "%s" instead.',
                revealOrder,
                revealOrder.toLowerCase()
              );
              break;
            case "forward":
            case "backward":
              error$jscomp$0(
                '"%s" is not a valid value for revealOrder on <SuspenseList />. React uses the -s suffix in the spelling. Use "%ss" instead.',
                revealOrder,
                revealOrder.toLowerCase()
              );
              break;
            default:
              error$jscomp$0(
                '"%s" is not a supported revealOrder on <SuspenseList />. Did you mean "together", "forwards" or "backwards"?',
                revealOrder
              );
          }
        else
          error$jscomp$0(
            '%s is not a supported value for revealOrder on <SuspenseList />. Did you mean "together", "forwards" or "backwards"?',
            revealOrder
          );
      void 0 === tailMode ||
        didWarnAboutTailOptions[tailMode] ||
        ("collapsed" !== tailMode && "hidden" !== tailMode
          ? ((didWarnAboutTailOptions[tailMode] = !0),
            error$jscomp$0(
              '"%s" is not a supported value for tail on <SuspenseList />. Did you mean "collapsed" or "hidden"?',
              tailMode
            ))
          : "forwards" !== revealOrder &&
            "backwards" !== revealOrder &&
            ((didWarnAboutTailOptions[tailMode] = !0),
            error$jscomp$0(
              '<SuspenseList tail="%s" /> is only valid if revealOrder is "forwards" or "backwards". Did you mean to specify revealOrder="forwards"?',
              tailMode
            )));
      a: if (
        ("forwards" === revealOrder || "backwards" === revealOrder) &&
        void 0 !== nextProps &&
        null !== nextProps &&
        !1 !== nextProps
      )
        if (isArrayImpl(nextProps))
          for (var i = 0; i < nextProps.length; i++) {
            if (!validateSuspenseListNestedChild(nextProps[i], i)) break a;
          }
        else if (((i = getIteratorFn(nextProps)), "function" === typeof i)) {
          if ((i = i.call(nextProps)))
            for (var step = i.next(), _i = 0; !step.done; step = i.next()) {
              if (!validateSuspenseListNestedChild(step.value, _i)) break a;
              _i++;
            }
        } else
          error$jscomp$0(
            'A single row was passed to a <SuspenseList revealOrder="%s" />. This is not useful since it needs multiple rows. Did you mean to pass multiple children or an array?',
            revealOrder
          );
      reconcileChildren(current, workInProgress, nextProps, renderLanes);
      nextProps = suspenseStackCursor.current;
      if (0 !== (nextProps & ForceSuspenseFallback))
        (nextProps =
          (nextProps & SubtreeSuspenseContextMask) | ForceSuspenseFallback),
          (workInProgress.flags |= 128);
      else {
        if (null !== current && 0 !== (current.flags & 128))
          a: for (current = workInProgress.child; null !== current; ) {
            if (13 === current.tag)
              null !== current.memoizedState &&
                scheduleSuspenseWorkOnFiber(
                  current,
                  renderLanes,
                  workInProgress
                );
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
        nextProps &= SubtreeSuspenseContextMask;
      }
      push(suspenseStackCursor, nextProps, workInProgress);
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
              : ((revealOrder = renderLanes.sibling),
                (renderLanes.sibling = null));
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
          pushHostRootContext(workInProgress);
          pushProvider(
            workInProgress,
            CacheContext,
            current.memoizedState.cache
          );
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
        case 23:
          return (
            (workInProgress.lanes = 0),
            updateOffscreenComponent(current, workInProgress, renderLanes)
          );
        case 24:
          pushProvider(
            workInProgress,
            CacheContext,
            current.memoizedState.cache
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
          didPerformWorkStackCursor.current ||
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
      else didReceiveUpdate = !1;
      workInProgress.lanes = 0;
      switch (workInProgress.tag) {
        case 16:
          a: if (
            ((prevSibling = workInProgress.elementType),
            resetSuspendedCurrentOnMountInLegacyMode(current, workInProgress),
            (returnFiber = workInProgress.pendingProps),
            (current = callLazyInitInDEV(prevSibling)),
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
            renderLanes = getComponentNameFromType(current) || current;
            throw Error(
              "Element type is invalid. Received a promise that resolves to: " +
                renderLanes +
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
          pushHostRootContext(workInProgress);
          if (null === current)
            throw Error("Should have a current fiber. This is a bug in React.");
          var nextProps = workInProgress.pendingProps;
          prevSibling = workInProgress.memoizedState;
          returnFiber = prevSibling.element;
          cloneUpdateQueue(current, workInProgress);
          processUpdateQueue(workInProgress, nextProps, null, renderLanes);
          nextProps = workInProgress.memoizedState;
          var nextCache = nextProps.cache;
          pushProvider(workInProgress, CacheContext, nextCache);
          nextCache !== prevSibling.cache &&
            propagateContextChanges(
              workInProgress,
              [CacheContext],
              renderLanes,
              !0
            );
          suspendIfUpdateReadFromEntangledAsyncAction();
          prevSibling = nextProps.element;
          prevSibling === returnFiber
            ? (workInProgress = bailoutOnAlreadyFinishedWork(
                current,
                workInProgress,
                renderLanes
              ))
            : (reconcileChildren(
                current,
                workInProgress,
                prevSibling,
                renderLanes
              ),
              (workInProgress = workInProgress.child));
          return workInProgress;
        case 26:
        case 27:
        case 5:
          return (
            pushHostContext(workInProgress),
            (returnFiber = workInProgress.pendingProps.children),
            null !== workInProgress.memoizedState &&
              ((prevSibling = renderWithHooks(
                current,
                workInProgress,
                TransitionAwareHostComponent,
                null,
                null,
                renderLanes
              )),
              (HostTransitionContext._currentValue2 = prevSibling)),
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
          return null;
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
              error$jscomp$0(
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
              error$jscomp$0(
                "A context consumer was rendered with multiple children, or a child that isn't a function. A context consumer expects a single child that is a function. If you did pass a function, make sure there is no trailing or leading whitespace around it."
              ),
            prepareToReadContext(workInProgress),
            (prevSibling = readContext(prevSibling)),
            markComponentRenderStarted(workInProgress),
            (returnFiber = callComponentInDEV(
              returnFiber,
              prevSibling,
              void 0
            )),
            markComponentRenderStopped(),
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
        case 17:
          return (
            (returnFiber = workInProgress.type),
            (prevSibling = resolveClassComponentProps(
              returnFiber,
              workInProgress.pendingProps
            )),
            resetSuspendedCurrentOnMountInLegacyMode(current, workInProgress),
            (workInProgress.tag = 1),
            isContextProvider(returnFiber)
              ? ((current = !0), pushContextProvider(workInProgress))
              : (current = !1),
            prepareToReadContext(workInProgress),
            constructClassInstance(workInProgress, returnFiber, prevSibling),
            mountClassInstance(
              workInProgress,
              returnFiber,
              prevSibling,
              renderLanes
            ),
            finishClassComponent(
              null,
              workInProgress,
              returnFiber,
              !0,
              current,
              renderLanes
            )
          );
        case 28:
          return (
            (returnFiber = workInProgress.type),
            (prevSibling = resolveClassComponentProps(
              returnFiber,
              workInProgress.pendingProps
            )),
            resetSuspendedCurrentOnMountInLegacyMode(current, workInProgress),
            (workInProgress.tag = 0),
            updateFunctionComponent(
              null,
              workInProgress,
              returnFiber,
              prevSibling,
              renderLanes
            )
          );
        case 19:
          return updateSuspenseListComponent(
            current,
            workInProgress,
            renderLanes
          );
        case 22:
          return updateOffscreenComponent(current, workInProgress, renderLanes);
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
        case 29:
          throw workInProgress.pendingProps;
      }
      throw Error(
        "Unknown unit of work tag (" +
          workInProgress.tag +
          "). This error is likely caused by a bug in React. Please file an issue."
      );
    }
    function resetContextDependencies() {
      lastFullyObservedContext =
        lastContextDependency =
        currentlyRenderingFiber =
          null;
      isDisallowedContextReadInDEV = !1;
    }
    function pushProvider(providerFiber, context, nextValue) {
      push(valueCursor, context._currentValue2, providerFiber);
      context._currentValue2 = nextValue;
      push(renderer2CursorDEV, context._currentRenderer2, providerFiber);
      void 0 !== context._currentRenderer2 &&
        null !== context._currentRenderer2 &&
        context._currentRenderer2 !== rendererSigil &&
        error$jscomp$0(
          "Detected multiple renderers concurrently rendering the same context provider. This is currently unsupported."
        );
      context._currentRenderer2 = rendererSigil;
    }
    function popProvider(context, providerFiber) {
      context._currentValue2 = valueCursor.current;
      var currentRenderer2 = renderer2CursorDEV.current;
      pop(renderer2CursorDEV, providerFiber);
      context._currentRenderer2 = currentRenderer2;
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
        error$jscomp$0(
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
    function prepareToReadContext(workInProgress) {
      currentlyRenderingFiber = workInProgress;
      lastFullyObservedContext = lastContextDependency = null;
      workInProgress = workInProgress.dependencies;
      null !== workInProgress && (workInProgress.firstContext = null);
    }
    function readContext(context) {
      isDisallowedContextReadInDEV &&
        error$jscomp$0(
          "Context can only be read while React is rendering. In classes, you can read it in the render method or getDerivedStateFromProps. In function components, you can read it directly in the function body, but not inside Hooks like useReducer() or useMemo()."
        );
      return readContextForConsumer(currentlyRenderingFiber, context);
    }
    function readContextDuringReconciliation(consumer, context) {
      null === currentlyRenderingFiber && prepareToReadContext(consumer);
      return readContextForConsumer(consumer, context);
    }
    function readContextForConsumer(consumer, context) {
      var value = context._currentValue2;
      if (lastFullyObservedContext !== context)
        if (
          ((context = { context: context, memoizedValue: value, next: null }),
          null === lastContextDependency)
        ) {
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
        warn(
          "A cache instance was retained after it was already freed. This likely indicates a bug in React."
        );
      cache.refCount++;
    }
    function releaseCache(cache) {
      cache.refCount--;
      0 > cache.refCount &&
        warn(
          "A cache instance was released after it was already freed. This likely indicates a bug in React."
        );
      0 === cache.refCount &&
        scheduleCallback$1(NormalPriority, function () {
          cache.controller.abort();
        });
    }
    function peekCacheFromPool() {
      var cacheResumedFromPreviousRender = resumedCache.current;
      return null !== cacheResumedFromPreviousRender
        ? cacheResumedFromPreviousRender
        : workInProgressRoot.pooledCache;
    }
    function pushTransition(offscreenWorkInProgress, prevCachePool) {
      null === prevCachePool
        ? push(resumedCache, resumedCache.current, offscreenWorkInProgress)
        : push(resumedCache, prevCachePool.pool, offscreenWorkInProgress);
    }
    function getSuspendedCache() {
      var cacheFromPool = peekCacheFromPool();
      return null === cacheFromPool
        ? null
        : { parent: CacheContext._currentValue2, pool: cacheFromPool };
    }
    function scheduleRetryEffect(workInProgress, retryQueue) {
      null !== retryQueue && (workInProgress.flags |= 4);
      workInProgress.flags & 16384 &&
        ((retryQueue =
          22 !== workInProgress.tag ? claimNextRetryLane() : 536870912),
        (workInProgress.lanes |= retryQueue));
    }
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
        if (0 !== (completedWork.mode & 2)) {
          for (
            var _treeBaseDuration = completedWork.selfBaseDuration,
              _child2 = completedWork.child;
            null !== _child2;

          )
            (newChildLanes |= _child2.lanes | _child2.childLanes),
              (subtreeFlags |= _child2.subtreeFlags & 31457280),
              (subtreeFlags |= _child2.flags & 31457280),
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
              (subtreeFlags |= _treeBaseDuration.subtreeFlags & 31457280),
              (subtreeFlags |= _treeBaseDuration.flags & 31457280),
              (_treeBaseDuration.return = completedWork),
              (_treeBaseDuration = _treeBaseDuration.sibling);
      else if (0 !== (completedWork.mode & 2)) {
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
            isContextProvider(workInProgress.type) &&
              popContext(workInProgress),
            bubbleProperties(workInProgress),
            null
          );
        case 3:
          return (
            (renderLanes = workInProgress.stateNode),
            (newProps = null),
            null !== current && (newProps = current.memoizedState.cache),
            workInProgress.memoizedState.cache !== newProps &&
              (workInProgress.flags |= 2048),
            popProvider(CacheContext, workInProgress),
            popHostContainer(workInProgress),
            popTopLevelContextObject(workInProgress),
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
            bubbleProperties(workInProgress),
            null
          );
        case 26:
        case 27:
        case 5:
          popHostContext(workInProgress);
          renderLanes = workInProgress.type;
          if (null !== current && null != workInProgress.stateNode)
            current.memoizedProps !== newProps && (workInProgress.flags |= 4);
          else {
            if (!newProps) {
              if (null === workInProgress.stateNode)
                throw Error(
                  "We must have new props for new mounts. This error is likely caused by a bug in React. Please file an issue."
                );
              bubbleProperties(workInProgress);
              return null;
            }
            requiredContext(contextStackCursor.current);
            current = requiredContext(rootInstanceStackCursor.current);
            current = {
              type: renderLanes,
              props: newProps,
              isHidden: !1,
              children: [],
              internalInstanceHandle: workInProgress,
              rootContainerInstance: current,
              tag: "INSTANCE"
            };
            a: for (
              renderLanes = workInProgress.child;
              null !== renderLanes;

            ) {
              if (5 === renderLanes.tag || 6 === renderLanes.tag) {
                newProps = current;
                var child = renderLanes.stateNode,
                  index = newProps.children.indexOf(child);
                -1 !== index && newProps.children.splice(index, 1);
                newProps.children.push(child);
              } else if (4 !== renderLanes.tag && null !== renderLanes.child) {
                renderLanes.child.return = renderLanes;
                renderLanes = renderLanes.child;
                continue;
              }
              if (renderLanes === workInProgress) break a;
              for (; null === renderLanes.sibling; ) {
                if (
                  null === renderLanes.return ||
                  renderLanes.return === workInProgress
                )
                  break a;
                renderLanes = renderLanes.return;
              }
              renderLanes.sibling.return = renderLanes.return;
              renderLanes = renderLanes.sibling;
            }
            workInProgress.stateNode = current;
          }
          bubbleProperties(workInProgress);
          workInProgress.flags &= -16777217;
          return null;
        case 6:
          if (current && null != workInProgress.stateNode)
            current.memoizedProps !== newProps && (workInProgress.flags |= 4);
          else {
            if (
              "string" !== typeof newProps &&
              null === workInProgress.stateNode
            )
              throw Error(
                "We must have new props for new mounts. This error is likely caused by a bug in React. Please file an issue."
              );
            requiredContext(rootInstanceStackCursor.current);
            requiredContext(contextStackCursor.current);
            workInProgress.stateNode = {
              text: newProps,
              isHidden: !1,
              tag: "TEXT"
            };
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
            if (null !== newProps && null !== newProps.dehydrated) {
              if (null === current) {
                throw Error(
                  "A dehydrated suspense component was completed without a hydrated node. This is probably a bug in React."
                );
                throw Error(
                  "Expected prepareToHydrateHostSuspenseInstance() to never be called. This error is likely caused by a bug in React. Please file an issue."
                );
              }
              index = hydrationDiffRootDEV;
              if (null !== index) {
                hydrationDiffRootDEV = null;
                try {
                  child = "\n\n" + describeNode(index, 0);
                } catch (x) {
                  child = "";
                }
                error$jscomp$0(
                  "A tree hydrated but some attributes of the server rendered HTML didn't match the client properties. This won't be patched up. This can happen if a SSR-ed Client Component used:\n\n- A server/client branch `if (typeof window !== 'undefined')`.\n- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.\n- Date formatting in a user's locale which doesn't match the server.\n- External changing data without sending a snapshot of it along with the HTML.\n- Invalid HTML tag nesting.\n\nIt can also happen if the client has a browser extension installed which messes with the HTML before React loaded.\n\n%s%s",
                  "https://react.dev/link/hydration-mismatch",
                  child
                );
              }
              0 === (workInProgress.flags & 128) &&
                (workInProgress.memoizedState = null);
              workInProgress.flags |= 4;
              bubbleProperties(workInProgress);
              0 !== (workInProgress.mode & 2) &&
                null !== newProps &&
                ((child = workInProgress.child),
                null !== child &&
                  (workInProgress.treeBaseDuration -= child.treeBaseDuration));
              child = !1;
            } else
              null !== hydrationErrors &&
                (queueRecoverableErrors(hydrationErrors),
                (hydrationErrors = null)),
                (child = !0);
            if (!child) {
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
            (child = null),
            null !== newProps.alternate &&
              null !== newProps.alternate.memoizedState &&
              null !== newProps.alternate.memoizedState.cachePool &&
              (child = newProps.alternate.memoizedState.cachePool.pool),
            (index = null),
            null !== newProps.memoizedState &&
              null !== newProps.memoizedState.cachePool &&
              (index = newProps.memoizedState.cachePool.pool),
            index !== child && (newProps.flags |= 2048));
          renderLanes !== current &&
            renderLanes &&
            (workInProgress.child.flags |= 8192);
          scheduleRetryEffect(workInProgress, workInProgress.updateQueue);
          bubbleProperties(workInProgress);
          0 !== (workInProgress.mode & 2) &&
            renderLanes &&
            ((current = workInProgress.child),
            null !== current &&
              (workInProgress.treeBaseDuration -= current.treeBaseDuration));
          return null;
        case 4:
          return (
            popHostContainer(workInProgress),
            bubbleProperties(workInProgress),
            null
          );
        case 10:
          return (
            popProvider(workInProgress.type, workInProgress),
            bubbleProperties(workInProgress),
            null
          );
        case 17:
          return (
            isContextProvider(workInProgress.type) &&
              popContext(workInProgress),
            bubbleProperties(workInProgress),
            null
          );
        case 19:
          pop(suspenseStackCursor, workInProgress);
          child = workInProgress.memoizedState;
          if (null === child) return bubbleProperties(workInProgress), null;
          newProps = 0 !== (workInProgress.flags & 128);
          index = child.rendering;
          if (null === index)
            if (newProps) cutOffTailIfNeeded(child, !1);
            else {
              if (
                workInProgressRootExitStatus !== RootInProgress ||
                (null !== current && 0 !== (current.flags & 128))
              )
                for (current = workInProgress.child; null !== current; ) {
                  index = findFirstSuspended(current);
                  if (null !== index) {
                    workInProgress.flags |= 128;
                    cutOffTailIfNeeded(child, !1);
                    current = index.updateQueue;
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
                    return workInProgress.child;
                  }
                  current = current.sibling;
                }
              null !== child.tail &&
                now$1() > workInProgressRootRenderTargetTime &&
                ((workInProgress.flags |= 128),
                (newProps = !0),
                cutOffTailIfNeeded(child, !1),
                (workInProgress.lanes = 4194304));
            }
          else {
            if (!newProps)
              if (((current = findFirstSuspended(index)), null !== current)) {
                if (
                  ((workInProgress.flags |= 128),
                  (newProps = !0),
                  (current = current.updateQueue),
                  (workInProgress.updateQueue = current),
                  scheduleRetryEffect(workInProgress, current),
                  cutOffTailIfNeeded(child, !0),
                  null === child.tail &&
                    "hidden" === child.tailMode &&
                    !index.alternate)
                )
                  return bubbleProperties(workInProgress), null;
              } else
                2 * now$1() - child.renderingStartTime >
                  workInProgressRootRenderTargetTime &&
                  536870912 !== renderLanes &&
                  ((workInProgress.flags |= 128),
                  (newProps = !0),
                  cutOffTailIfNeeded(child, !1),
                  (workInProgress.lanes = 4194304));
            child.isBackwards
              ? ((index.sibling = workInProgress.child),
                (workInProgress.child = index))
              : ((current = child.last),
                null !== current
                  ? (current.sibling = index)
                  : (workInProgress.child = index),
                (child.last = index));
          }
          if (null !== child.tail)
            return (
              (current = child.tail),
              (child.rendering = current),
              (child.tail = current.sibling),
              (child.renderingStartTime = now$1()),
              (current.sibling = null),
              (renderLanes = suspenseStackCursor.current),
              (renderLanes = newProps
                ? (renderLanes & SubtreeSuspenseContextMask) |
                  ForceSuspenseFallback
                : renderLanes & SubtreeSuspenseContextMask),
              push(suspenseStackCursor, renderLanes, workInProgress),
              current
            );
          bubbleProperties(workInProgress);
          return null;
        case 22:
        case 23:
          return (
            popSuspenseHandler(workInProgress),
            popHiddenContext(workInProgress),
            (newProps = null !== workInProgress.memoizedState),
            null !== current
              ? (null !== current.memoizedState) !== newProps &&
                (workInProgress.flags |= 8192)
              : newProps && (workInProgress.flags |= 8192),
            newProps && 0 !== (workInProgress.mode & 1)
              ? 0 !== (renderLanes & 536870912) &&
                0 === (workInProgress.flags & 128) &&
                (bubbleProperties(workInProgress),
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
            null !== current && pop(resumedCache, workInProgress),
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
          return null;
        case 29:
          return null;
      }
      throw Error(
        "Unknown unit of work tag (" +
          workInProgress.tag +
          "). This error is likely caused by a bug in React. Please file an issue."
      );
    }
    function unwindWork(current, workInProgress) {
      switch (workInProgress.tag) {
        case 1:
          return (
            isContextProvider(workInProgress.type) &&
              popContext(workInProgress),
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
            popProvider(CacheContext, workInProgress),
            popHostContainer(workInProgress),
            popTopLevelContextObject(workInProgress),
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
        case 13:
          popSuspenseHandler(workInProgress);
          current = workInProgress.memoizedState;
          if (
            null !== current &&
            null !== current.dehydrated &&
            null === workInProgress.alternate
          )
            throw Error(
              "Threw in newly mounted dehydrated component. This is likely a bug in React. Please file an issue."
            );
          current = workInProgress.flags;
          return current & 65536
            ? ((workInProgress.flags = (current & -65537) | 128),
              0 !== (workInProgress.mode & 2) &&
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
            null !== current && pop(resumedCache, workInProgress),
            (current = workInProgress.flags),
            current & 65536
              ? ((workInProgress.flags = (current & -65537) | 128),
                0 !== (workInProgress.mode & 2) &&
                  transferActualDuration(workInProgress),
                workInProgress)
              : null
          );
        case 24:
          return popProvider(CacheContext, workInProgress), null;
        case 25:
          return null;
        default:
          return null;
      }
    }
    function unwindInterruptedWork(current, interruptedWork) {
      switch (interruptedWork.tag) {
        case 1:
          current = interruptedWork.type.childContextTypes;
          null !== current && void 0 !== current && popContext(interruptedWork);
          break;
        case 3:
          popProvider(CacheContext, interruptedWork);
          popHostContainer(interruptedWork);
          popTopLevelContextObject(interruptedWork);
          break;
        case 26:
        case 27:
        case 5:
          popHostContext(interruptedWork);
          break;
        case 4:
          popHostContainer(interruptedWork);
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
          null !== current && pop(resumedCache, interruptedWork);
          break;
        case 24:
          popProvider(CacheContext, interruptedWork);
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
            if (
              (updateQueue.tag & flags) === flags &&
              ((flags & Passive) !== NoFlags
                ? null !== injectedProfilingHooks &&
                  "function" ===
                    typeof injectedProfilingHooks.markComponentPassiveEffectMountStarted &&
                  injectedProfilingHooks.markComponentPassiveEffectMountStarted(
                    finishedWork
                  )
                : (flags & Layout) !== NoFlags &&
                  null !== injectedProfilingHooks &&
                  "function" ===
                    typeof injectedProfilingHooks.markComponentLayoutEffectMountStarted &&
                  injectedProfilingHooks.markComponentLayoutEffectMountStarted(
                    finishedWork
                  ),
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
              (flags & Passive) !== NoFlags
                ? null !== injectedProfilingHooks &&
                  "function" ===
                    typeof injectedProfilingHooks.markComponentPassiveEffectMountStopped &&
                  injectedProfilingHooks.markComponentPassiveEffectMountStopped()
                : (flags & Layout) !== NoFlags &&
                  null !== injectedProfilingHooks &&
                  "function" ===
                    typeof injectedProfilingHooks.markComponentLayoutEffectMountStopped &&
                  injectedProfilingHooks.markComponentLayoutEffectMountStopped(),
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
                  error$jscomp$0(
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
      } catch (error$11) {
        captureCommitPhaseError(finishedWork, finishedWork.return, error$11);
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
                (flags & Passive) !== NoFlags
                  ? null !== injectedProfilingHooks &&
                    "function" ===
                      typeof injectedProfilingHooks.markComponentPassiveEffectUnmountStarted &&
                    injectedProfilingHooks.markComponentPassiveEffectUnmountStarted(
                      finishedWork
                    )
                  : (flags & Layout) !== NoFlags &&
                    null !== injectedProfilingHooks &&
                    "function" ===
                      typeof injectedProfilingHooks.markComponentLayoutEffectUnmountStarted &&
                    injectedProfilingHooks.markComponentLayoutEffectUnmountStarted(
                      finishedWork
                    ),
                (flags & Insertion) !== NoFlags &&
                  (isRunningInsertionEffect = !0),
                runWithFiberInDEV(
                  finishedWork,
                  callDestroyInDEV,
                  finishedWork,
                  nearestMountedAncestor,
                  destroy
                ),
                (flags & Insertion) !== NoFlags &&
                  (isRunningInsertionEffect = !1),
                (flags & Passive) !== NoFlags
                  ? null !== injectedProfilingHooks &&
                    "function" ===
                      typeof injectedProfilingHooks.markComponentPassiveEffectUnmountStopped &&
                    injectedProfilingHooks.markComponentPassiveEffectUnmountStopped()
                  : (flags & Layout) !== NoFlags &&
                    null !== injectedProfilingHooks &&
                    "function" ===
                      typeof injectedProfilingHooks.markComponentLayoutEffectUnmountStopped &&
                    injectedProfilingHooks.markComponentLayoutEffectUnmountStopped());
            }
            updateQueue = updateQueue.next;
          } while (updateQueue !== firstEffect);
        }
      } catch (error$12) {
        captureCommitPhaseError(finishedWork, finishedWork.return, error$12);
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
    function commitClassDidMount(finishedWork) {
      var instance = finishedWork.stateNode;
      "function" === typeof instance.componentDidMount &&
        runWithFiberInDEV(
          finishedWork,
          callComponentDidMountInDEV,
          finishedWork,
          instance
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
            error$jscomp$0(
              "Expected %s props to match memoized props before processing the update queue. This might either be because of a bug in React, or because a component reassigns its own `this.props`. Please file an issue.",
              getComponentNameFromFiber(finishedWork) || "instance"
            ),
          instance.state !== finishedWork.memoizedState &&
            error$jscomp$0(
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
        } catch (error$13) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error$13);
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
          error$jscomp$0(
            "Expected %s props to match memoized props before getSnapshotBeforeUpdate. This might either be because of a bug in React, or because a component reassigns its own `this.props`. Please file an issue.",
            getComponentNameFromFiber(finishedWork) || "instance"
          ),
        current.state !== finishedWork.memoizedState &&
          error$jscomp$0(
            "Expected %s state to match memoized state before getSnapshotBeforeUpdate. This might either be because of a bug in React, or because a component reassigns its own `this.state`. Please file an issue.",
            getComponentNameFromFiber(finishedWork) || "instance"
          ));
      try {
        var resolvedPrevProps = resolveClassComponentProps(
          finishedWork.type,
          prevProps,
          finishedWork.elementType === finishedWork.type
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
            error$jscomp$0(
              "%s.getSnapshotBeforeUpdate(): A snapshot value (or null) must be returned. You have returned undefined.",
              getComponentNameFromFiber(finishedWork)
            );
          }));
        current.__reactInternalSnapshotBeforeUpdate = snapshot;
      } catch (error$16) {
        captureCommitPhaseError(finishedWork, finishedWork.return, error$16);
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
        var instance = finishedWork.stateNode;
        switch (finishedWork.tag) {
          case 26:
          case 27:
          case 5:
            instance = getPublicInstance(instance);
        }
        if ("function" === typeof ref)
          if (shouldProfile(finishedWork))
            try {
              startEffectTimer(), (finishedWork.refCleanup = ref(instance));
            } finally {
              recordEffectDuration();
            }
          else finishedWork.refCleanup = ref(instance);
        else
          "string" === typeof ref
            ? error$jscomp$0("String refs are no longer supported.")
            : ref.hasOwnProperty("current") ||
              error$jscomp$0(
                "Unexpected ref object provided for %s. Use either a ref-setter function or React.createRef().",
                getComponentNameFromFiber(finishedWork)
              ),
            (ref.current = instance);
      }
    }
    function safelyAttachRef(current, nearestMountedAncestor) {
      try {
        runWithFiberInDEV(current, commitAttachRef, current);
      } catch (error$17) {
        captureCommitPhaseError(current, nearestMountedAncestor, error$17);
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
          } catch (error$18) {
            captureCommitPhaseError(current, nearestMountedAncestor, error$18);
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
          } catch (error$19) {
            captureCommitPhaseError(current, nearestMountedAncestor, error$19);
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
        onCommit(
          finishedWork.memoizedProps.id,
          current,
          effectDuration,
          commitStartTime
        );
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
      } catch (error$22) {
        captureCommitPhaseError(finishedWork, finishedWork.return, error$22);
      }
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
        (node = node.stateNode),
          before
            ? insertInContainerBefore(parent, node, before)
            : appendChildToContainer(parent, node);
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
        (node = node.stateNode),
          before
            ? insertBefore(parent, node, before)
            : appendChild(parent, node);
      else if (4 !== tag && ((node = node.child), null !== node))
        for (
          insertOrAppendPlacementNode(node, before, parent),
            node = node.sibling;
          null !== node;

        )
          insertOrAppendPlacementNode(node, before, parent),
            (node = node.sibling);
    }
    function commitPlacement(finishedWork) {
      a: {
        for (var parent = finishedWork.return; null !== parent; ) {
          if (isHostParent(parent)) {
            var parentFiber = parent;
            break a;
          }
          parent = parent.return;
        }
        throw Error(
          "Expected to find a host parent. This error is likely caused by a bug in React. Please file an issue."
        );
      }
      switch (parentFiber.tag) {
        case 27:
        case 5:
          parent = parentFiber.stateNode;
          parentFiber.flags & 32 && (parentFiber.flags &= -33);
          parentFiber = getHostSibling(finishedWork);
          insertOrAppendPlacementNode(finishedWork, parentFiber, parent);
          break;
        case 3:
        case 4:
          parent = parentFiber.stateNode.containerInfo;
          parentFiber = getHostSibling(finishedWork);
          insertOrAppendPlacementNodeIntoContainer(
            finishedWork,
            parentFiber,
            parent
          );
          break;
        default:
          throw Error(
            "Invalid host parent fiber. This error is likely caused by a bug in React. Please file an issue."
          );
      }
    }
    function commitBeforeMutationEffects(root, firstChild) {
      for (nextEffect = firstChild; null !== nextEffect; )
        if (
          ((root = nextEffect),
          (firstChild = root.child),
          0 !== (root.subtreeFlags & 1028) && null !== firstChild)
        )
          (firstChild.return = root), (nextEffect = firstChild);
        else
          for (; null !== nextEffect; ) {
            firstChild = root = nextEffect;
            var current = firstChild.alternate,
              flags = firstChild.flags;
            switch (firstChild.tag) {
              case 0:
                break;
              case 11:
              case 15:
                break;
              case 1:
                0 !== (flags & 1024) &&
                  null !== current &&
                  commitClassSnapshot(firstChild, current);
                break;
              case 3:
                0 !== (flags & 1024) &&
                  firstChild.stateNode.containerInfo.children.splice(0);
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
                  throw Error(
                    "This unit of work tag should not have side-effects. This error is likely caused by a bug in React. Please file an issue."
                  );
            }
            firstChild = root.sibling;
            if (null !== firstChild) {
              firstChild.return = root.return;
              nextEffect = firstChild;
              break;
            }
            nextEffect = root.return;
          }
      root = shouldFireAfterActiveInstanceBlur;
      shouldFireAfterActiveInstanceBlur = !1;
      return root;
    }
    function commitLayoutEffectOnFiber(finishedRoot, current, finishedWork) {
      var flags = finishedWork.flags;
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
                  error$jscomp$0(
                    "Expected %s props to match memoized props before componentDidMount. This might either be because of a bug in React, or because a component reassigns its own `this.props`. Please file an issue.",
                    getComponentNameFromFiber(finishedWork) || "instance"
                  ),
                finishedRoot.state !== finishedWork.memoizedState &&
                  error$jscomp$0(
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
                  error$jscomp$0(
                    "Expected %s props to match memoized props before componentDidUpdate. This might either be because of a bug in React, or because a component reassigns its own `this.props`. Please file an issue.",
                    getComponentNameFromFiber(finishedWork) || "instance"
                  ),
                finishedRoot.state !== finishedWork.memoizedState &&
                  error$jscomp$0(
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
            } catch (error$15) {
              captureCommitPhaseError(
                finishedWork,
                finishedWork.return,
                error$15
              );
            }
          }
          finishedRoot.effectDuration += popNestedEffectDurations(current);
          break;
        case 26:
        case 27:
        case 5:
          recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
          null === current && flags & 4 && commitHostMount(finishedWork);
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
            } catch (error$20) {
              captureCommitPhaseError(
                finishedWork,
                finishedWork.return,
                error$20
              );
            }
          } else recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
          break;
        case 13:
          recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
          break;
        case 22:
          if (0 !== (finishedWork.mode & 1)) {
            if (
              ((prevProps =
                null !== finishedWork.memoizedState ||
                offscreenSubtreeIsHidden),
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
    function detachFiberAfterEffects(fiber) {
      var alternate = fiber.alternate;
      null !== alternate &&
        ((fiber.alternate = null), detachFiberAfterEffects(alternate));
      fiber.child = null;
      fiber.deletions = null;
      fiber.sibling = null;
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
            error$jscomp$0(
              "React instrumentation encountered an error: %s",
              err
            ));
        }
      switch (deletedFiber.tag) {
        case 26:
        case 27:
        case 5:
          offscreenSubtreeWasHidden ||
            safelyDetachRef(deletedFiber, nearestMountedAncestor);
        case 6:
          var _prevHostParent = hostParent,
            _prevHostParentIsContainer = hostParentIsContainer;
          hostParent = null;
          recursivelyTraverseDeletionEffects(
            finishedRoot,
            nearestMountedAncestor,
            deletedFiber
          );
          hostParent = _prevHostParent;
          hostParentIsContainer = _prevHostParentIsContainer;
          if (null !== hostParent)
            if (hostParentIsContainer)
              try {
                runWithFiberInDEV(
                  deletedFiber,
                  removeChildFromContainer,
                  hostParent,
                  deletedFiber.stateNode
                );
              } catch (error$29) {
                captureCommitPhaseError(
                  deletedFiber,
                  nearestMountedAncestor,
                  error$29
                );
              }
            else
              try {
                runWithFiberInDEV(
                  deletedFiber,
                  removeChild,
                  hostParent,
                  deletedFiber.stateNode
                );
              } catch (error$30) {
                captureCommitPhaseError(
                  deletedFiber,
                  nearestMountedAncestor,
                  error$30
                );
              }
          break;
        case 18:
          null !== hostParent &&
            (hostParentIsContainer
              ? clearSuspenseBoundaryFromContainer()
              : clearSuspenseBoundary());
          break;
        case 4:
          _prevHostParent = hostParent;
          _prevHostParentIsContainer = hostParentIsContainer;
          hostParent = deletedFiber.stateNode.containerInfo;
          hostParentIsContainer = !0;
          recursivelyTraverseDeletionEffects(
            finishedRoot,
            nearestMountedAncestor,
            deletedFiber
          );
          hostParent = _prevHostParent;
          hostParentIsContainer = _prevHostParentIsContainer;
          break;
        case 0:
        case 11:
        case 14:
        case 15:
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
            (_prevHostParent = deletedFiber.stateNode),
            "function" === typeof _prevHostParent.componentWillUnmount &&
              safelyCallComponentWillUnmount(
                deletedFiber,
                nearestMountedAncestor,
                _prevHostParent
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
          safelyDetachRef(deletedFiber, nearestMountedAncestor);
          deletedFiber.mode & 1
            ? ((offscreenSubtreeWasHidden =
                (_prevHostParent = offscreenSubtreeWasHidden) ||
                null !== deletedFiber.memoizedState),
              recursivelyTraverseDeletionEffects(
                finishedRoot,
                nearestMountedAncestor,
                deletedFiber
              ),
              (offscreenSubtreeWasHidden = _prevHostParent))
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
        var retry = resolveRetryWakeable.bind(null, finishedWork, wakeable);
        retryCache.has(wakeable) ||
          (retryCache.add(wakeable), wakeable.then(retry, retry));
      });
    }
    function recursivelyTraverseMutationEffects(root$jscomp$0, parentFiber) {
      var deletions = parentFiber.deletions;
      if (null !== deletions)
        for (var i = 0; i < deletions.length; i++) {
          var root = root$jscomp$0,
            returnFiber = parentFiber,
            deletedFiber = deletions[i],
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
          if (null === hostParent)
            throw Error(
              "Expected to find a host parent. This error is likely caused by a bug in React. Please file an issue."
            );
          commitDeletionEffectsOnFiber(root, returnFiber, deletedFiber);
          hostParent = null;
          hostParentIsContainer = !1;
          root = deletedFiber;
          returnFiber = root.alternate;
          null !== returnFiber && (returnFiber.return = null);
          root.return = null;
        }
      if (parentFiber.subtreeFlags & 13878)
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
          recursivelyTraverseMutationEffects(root, finishedWork);
          commitReconciliationEffects(finishedWork);
          flags & 512 &&
            null !== current &&
            safelyDetachRef(current, current.return);
          if (
            flags & 64 &&
            offscreenSubtreeIsHidden &&
            ((finishedWork = finishedWork.updateQueue),
            null !== finishedWork &&
              ((flags = finishedWork.callbacks), null !== flags))
          ) {
            var existingHiddenCallbacks = finishedWork.shared.hiddenCallbacks;
            finishedWork.shared.hiddenCallbacks =
              null === existingHiddenCallbacks
                ? flags
                : existingHiddenCallbacks.concat(flags);
          }
          break;
        case 26:
        case 27:
        case 5:
          recursivelyTraverseMutationEffects(root, finishedWork);
          commitReconciliationEffects(finishedWork);
          flags & 512 &&
            null !== current &&
            safelyDetachRef(current, current.return);
          if (finishedWork.flags & 32) {
            existingHiddenCallbacks = finishedWork.stateNode;
            try {
              runWithFiberInDEV(
                finishedWork,
                resetTextContent,
                existingHiddenCallbacks
              );
            } catch (error$25) {
              captureCommitPhaseError(
                finishedWork,
                finishedWork.return,
                error$25
              );
            }
          }
          if (flags & 4 && null != finishedWork.stateNode) {
            existingHiddenCallbacks = finishedWork.memoizedProps;
            var oldProps =
              null !== current
                ? current.memoizedProps
                : existingHiddenCallbacks;
            try {
              runWithFiberInDEV(
                finishedWork,
                commitUpdate,
                finishedWork.stateNode,
                finishedWork.type,
                oldProps,
                existingHiddenCallbacks,
                finishedWork
              );
            } catch (error$23) {
              captureCommitPhaseError(
                finishedWork,
                finishedWork.return,
                error$23
              );
            }
          }
          flags & 1024 &&
            "form" !== finishedWork.type &&
            error$jscomp$0(
              "Unexpected host component type. Expected a form. This is a bug in React."
            );
          break;
        case 6:
          recursivelyTraverseMutationEffects(root, finishedWork);
          commitReconciliationEffects(finishedWork);
          if (flags & 4) {
            if (null === finishedWork.stateNode)
              throw Error(
                "This should have a text node initialized. This error is likely caused by a bug in React. Please file an issue."
              );
            flags = finishedWork.memoizedProps;
            existingHiddenCallbacks =
              null !== current ? current.memoizedProps : flags;
            oldProps = finishedWork.stateNode;
            try {
              runWithFiberInDEV(
                finishedWork,
                commitTextUpdate,
                oldProps,
                existingHiddenCallbacks,
                flags
              );
            } catch (error$24) {
              captureCommitPhaseError(
                finishedWork,
                finishedWork.return,
                error$24
              );
            }
          }
          break;
        case 3:
          flags = pushNestedEffectDurations();
          recursivelyTraverseMutationEffects(root, finishedWork);
          commitReconciliationEffects(finishedWork);
          root.effectDuration += popNestedEffectDurations(flags);
          break;
        case 4:
          recursivelyTraverseMutationEffects(root, finishedWork);
          commitReconciliationEffects(finishedWork);
          break;
        case 12:
          flags = pushNestedEffectDurations();
          recursivelyTraverseMutationEffects(root, finishedWork);
          commitReconciliationEffects(finishedWork);
          finishedWork.stateNode.effectDuration +=
            bubbleNestedEffectDurations(flags);
          break;
        case 13:
          recursivelyTraverseMutationEffects(root, finishedWork);
          commitReconciliationEffects(finishedWork);
          finishedWork.child.flags & 8192 &&
            ((existingHiddenCallbacks =
              null !== current && null !== current.memoizedState),
            null === finishedWork.memoizedState ||
              existingHiddenCallbacks ||
              (globalMostRecentFallbackTime = now$1()));
          flags & 4 &&
            ((flags = finishedWork.updateQueue),
            null !== flags &&
              ((finishedWork.updateQueue = null),
              attachSuspenseRetryListeners(finishedWork, flags)));
          break;
        case 22:
          flags & 512 &&
            null !== current &&
            safelyDetachRef(current, current.return);
          existingHiddenCallbacks = null !== finishedWork.memoizedState;
          var wasHidden = null !== current && null !== current.memoizedState;
          if (finishedWork.mode & 1) {
            var prevOffscreenSubtreeIsHidden = offscreenSubtreeIsHidden,
              prevOffscreenSubtreeWasHidden = offscreenSubtreeWasHidden;
            offscreenSubtreeIsHidden =
              prevOffscreenSubtreeIsHidden || existingHiddenCallbacks;
            offscreenSubtreeWasHidden =
              prevOffscreenSubtreeWasHidden || wasHidden;
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
            ((root._visibility = existingHiddenCallbacks
              ? root._visibility & -2
              : root._visibility | 1),
            existingHiddenCallbacks &&
              ((root = offscreenSubtreeIsHidden || offscreenSubtreeWasHidden),
              null === current ||
                wasHidden ||
                root ||
                (0 !== (finishedWork.mode & 1) &&
                  recursivelyTraverseDisappearLayoutEffects(finishedWork))),
            null === finishedWork.memoizedProps ||
              "manual" !== finishedWork.memoizedProps.mode)
          )
            a: for (current = null, root = finishedWork; ; ) {
              if (5 === root.tag) {
                if (null === current) {
                  wasHidden = current = root;
                  try {
                    (oldProps = wasHidden.stateNode),
                      existingHiddenCallbacks
                        ? runWithFiberInDEV(wasHidden, hideInstance, oldProps)
                        : runWithFiberInDEV(
                            wasHidden,
                            unhideInstance,
                            wasHidden.stateNode,
                            wasHidden.memoizedProps
                          );
                  } catch (error$26) {
                    captureCommitPhaseError(
                      wasHidden,
                      wasHidden.return,
                      error$26
                    );
                  }
                }
              } else if (6 === root.tag) {
                if (null === current) {
                  wasHidden = root;
                  try {
                    var instance = wasHidden.stateNode;
                    existingHiddenCallbacks
                      ? runWithFiberInDEV(wasHidden, hideTextInstance, instance)
                      : runWithFiberInDEV(
                          wasHidden,
                          unhideTextInstance,
                          instance,
                          wasHidden.memoizedProps
                        );
                  } catch (error$27) {
                    captureCommitPhaseError(
                      wasHidden,
                      wasHidden.return,
                      error$27
                    );
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
              ((existingHiddenCallbacks = flags.retryQueue),
              null !== existingHiddenCallbacks &&
                ((flags.retryQueue = null),
                attachSuspenseRetryListeners(
                  finishedWork,
                  existingHiddenCallbacks
                ))));
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
          runWithFiberInDEV(finishedWork, commitPlacement, finishedWork);
        } catch (error$28) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error$28);
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
    function disappearLayoutEffects(finishedWork) {
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
      var flags = finishedWork.flags;
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
          commitClassDidMount(finishedWork);
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
            } catch (error$14) {
              captureCommitPhaseError(
                finishedWork,
                finishedWork.return,
                error$14
              );
            }
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
            } catch (error$20) {
              captureCommitPhaseError(
                finishedWork,
                finishedWork.return,
                error$20
              );
            }
          } else
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
        (null != current && retainCache(current),
        null != previousCache && releaseCache(previousCache));
    }
    function commitCachePassiveMountEffect(current, finishedWork) {
      current = null;
      null !== finishedWork.alternate &&
        (current = finishedWork.alternate.memoizedState.cache);
      finishedWork = finishedWork.memoizedState.cache;
      finishedWork !== current &&
        (retainCache(finishedWork), null != current && releaseCache(current));
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
          flags & 2048 &&
            commitHookPassiveMountEffects(finishedWork, Passive | HasEffect);
          break;
        case 3:
          var prevEffectDuration = pushNestedEffectDurations();
          recursivelyTraversePassiveMountEffects(
            finishedRoot,
            finishedWork,
            committedLanes,
            committedTransitions
          );
          flags & 2048 &&
            ((committedLanes = null),
            null !== finishedWork.alternate &&
              (committedLanes = finishedWork.alternate.memoizedState.cache),
            (finishedWork = finishedWork.memoizedState.cache),
            finishedWork !== committedLanes &&
              (retainCache(finishedWork),
              null != committedLanes && releaseCache(committedLanes)));
          finishedRoot.passiveEffectDuration +=
            popNestedEffectDurations(prevEffectDuration);
          break;
        case 12:
          if (flags & 2048) {
            prevEffectDuration = pushNestedEffectDurations();
            recursivelyTraversePassiveMountEffects(
              finishedRoot,
              finishedWork,
              committedLanes,
              committedTransitions
            );
            finishedRoot = finishedWork.stateNode;
            finishedRoot.passiveEffectDuration +=
              bubbleNestedEffectDurations(prevEffectDuration);
            try {
              runWithFiberInDEV(
                finishedWork,
                commitProfilerPostCommitImpl,
                finishedWork,
                finishedWork.alternate,
                commitStartTime,
                finishedRoot.passiveEffectDuration
              );
            } catch (error$21) {
              captureCommitPhaseError(
                finishedWork,
                finishedWork.return,
                error$21
              );
            }
          } else
            recursivelyTraversePassiveMountEffects(
              finishedRoot,
              finishedWork,
              committedLanes,
              committedTransitions
            );
          break;
        case 23:
          break;
        case 22:
          prevEffectDuration = finishedWork.stateNode;
          null !== finishedWork.memoizedState
            ? prevEffectDuration._visibility & 4
              ? recursivelyTraversePassiveMountEffects(
                  finishedRoot,
                  finishedWork,
                  committedLanes,
                  committedTransitions
                )
              : finishedWork.mode & 1
                ? recursivelyTraverseAtomicPassiveEffects(
                    finishedRoot,
                    finishedWork
                  )
                : ((prevEffectDuration._visibility |= 4),
                  recursivelyTraversePassiveMountEffects(
                    finishedRoot,
                    finishedWork,
                    committedLanes,
                    committedTransitions
                  ))
            : prevEffectDuration._visibility & 4
              ? recursivelyTraversePassiveMountEffects(
                  finishedRoot,
                  finishedWork,
                  committedLanes,
                  committedTransitions
                )
              : ((prevEffectDuration._visibility |= 4),
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
              finishedWork
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
      finishedRoot,
      parentFiber,
      committedLanes,
      committedTransitions,
      includeWorkInProgressEffects
    ) {
      includeWorkInProgressEffects =
        includeWorkInProgressEffects &&
        0 !== (parentFiber.subtreeFlags & 10256);
      for (parentFiber = parentFiber.child; null !== parentFiber; )
        reconnectPassiveEffects(
          finishedRoot,
          parentFiber,
          committedLanes,
          committedTransitions,
          includeWorkInProgressEffects
        ),
          (parentFiber = parentFiber.sibling);
    }
    function reconnectPassiveEffects(
      finishedRoot,
      finishedWork,
      committedLanes,
      committedTransitions,
      includeWorkInProgressEffects
    ) {
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
            includeWorkInProgressEffects
          );
          commitHookPassiveMountEffects(finishedWork, Passive);
          break;
        case 23:
          break;
        case 22:
          var _instance2 = finishedWork.stateNode;
          null !== finishedWork.memoizedState
            ? _instance2._visibility & 4
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
                : ((_instance2._visibility |= 4),
                  recursivelyTraverseReconnectPassiveEffects(
                    finishedRoot,
                    finishedWork,
                    committedLanes,
                    committedTransitions,
                    includeWorkInProgressEffects
                  ))
            : ((_instance2._visibility |= 4),
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
              finishedWork
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
        default:
          recursivelyTraverseReconnectPassiveEffects(
            finishedRoot,
            finishedWork,
            committedLanes,
            committedTransitions,
            includeWorkInProgressEffects
          );
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
              recursivelyTraverseAtomicPassiveEffects(
                finishedRoot,
                finishedWork
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
                finishedWork
              );
              flags & 2048 &&
                commitCachePassiveMountEffect(
                  finishedWork.alternate,
                  finishedWork
                );
              break;
            default:
              recursivelyTraverseAtomicPassiveEffects(
                finishedRoot,
                finishedWork
              );
          }
          parentFiber = parentFiber.sibling;
        }
    }
    function recursivelyAccumulateSuspenseyCommit(parentFiber) {
      if (parentFiber.subtreeFlags & suspenseyCommitFlag)
        for (parentFiber = parentFiber.child; null !== parentFiber; )
          accumulateSuspenseyCommitOnFiber(parentFiber),
            (parentFiber = parentFiber.sibling);
    }
    function accumulateSuspenseyCommitOnFiber(fiber) {
      switch (fiber.tag) {
        case 26:
          recursivelyAccumulateSuspenseyCommit(fiber);
          fiber.flags & suspenseyCommitFlag &&
            null !== fiber.memoizedState &&
            suspendResource();
          break;
        case 5:
          recursivelyAccumulateSuspenseyCommit(fiber);
          break;
        case 3:
        case 4:
          recursivelyAccumulateSuspenseyCommit(fiber);
          break;
        case 22:
          if (null === fiber.memoizedState) {
            var current = fiber.alternate;
            null !== current && null !== current.memoizedState
              ? ((current = suspenseyCommitFlag),
                (suspenseyCommitFlag = 16777216),
                recursivelyAccumulateSuspenseyCommit(fiber),
                (suspenseyCommitFlag = current))
              : recursivelyAccumulateSuspenseyCommit(fiber);
          }
          break;
        default:
          recursivelyAccumulateSuspenseyCommit(fiber);
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
            commitHookPassiveUnmountEffects(
              finishedWork,
              finishedWork.return,
              Passive | HasEffect
            );
          break;
        case 3:
          var prevEffectDuration = pushNestedEffectDurations();
          recursivelyTraversePassiveUnmountEffects(finishedWork);
          finishedWork.stateNode.passiveEffectDuration +=
            popNestedEffectDurations(prevEffectDuration);
          break;
        case 12:
          prevEffectDuration = pushNestedEffectDurations();
          recursivelyTraversePassiveUnmountEffects(finishedWork);
          finishedWork.stateNode.passiveEffectDuration +=
            bubbleNestedEffectDurations(prevEffectDuration);
          break;
        case 22:
          prevEffectDuration = finishedWork.stateNode;
          null !== finishedWork.memoizedState &&
          prevEffectDuration._visibility & 4 &&
          (null === finishedWork.return || 13 !== finishedWork.return.tag)
            ? ((prevEffectDuration._visibility &= -5),
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
      for (parentFiber = parentFiber.child; null !== parentFiber; )
        disconnectPassiveEffect(parentFiber),
          (parentFiber = parentFiber.sibling);
    }
    function disconnectPassiveEffect(finishedWork) {
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
          instance._visibility & 4 &&
            ((instance._visibility &= -5),
            recursivelyTraverseDisconnectPassiveEffects(finishedWork));
          break;
        default:
          recursivelyTraverseDisconnectPassiveEffects(finishedWork);
      }
    }
    function commitPassiveUnmountEffectsInsideOfDeletedTree_begin(
      deletedSubtreeRoot,
      nearestMountedAncestor
    ) {
      for (; null !== nextEffect; ) {
        var fiber = nextEffect,
          current = fiber;
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
              ((current = current.memoizedState.cachePool.pool),
              null != current && retainCache(current));
            break;
          case 24:
            releaseCache(current.memoizedState.cache);
        }
        current = fiber.child;
        if (null !== current) (current.return = fiber), (nextEffect = current);
        else
          a: for (fiber = deletedSubtreeRoot; null !== nextEffect; ) {
            current = nextEffect;
            var sibling = current.sibling,
              returnFiber = current.return;
            detachFiberAfterEffects(current);
            if (current === fiber) {
              nextEffect = null;
              break a;
            }
            if (null !== sibling) {
              sibling.return = returnFiber;
              nextEffect = sibling;
              break a;
            }
            nextEffect = returnFiber;
          }
      }
    }
    function invokeLayoutEffectMountInDEV(fiber) {
      switch (fiber.tag) {
        case 0:
        case 11:
        case 15:
          commitHookEffectListMount(Layout | HasEffect, fiber);
          break;
        case 1:
          commitClassDidMount(fiber);
      }
    }
    function invokePassiveEffectMountInDEV(fiber) {
      switch (fiber.tag) {
        case 0:
        case 11:
        case 15:
          commitHookEffectListMount(Passive | HasEffect, fiber);
      }
    }
    function invokeLayoutEffectUnmountInDEV(fiber) {
      switch (fiber.tag) {
        case 0:
        case 11:
        case 15:
          commitHookEffectListUnmount(Layout | HasEffect, fiber, fiber.return);
          break;
        case 1:
          var instance = fiber.stateNode;
          "function" === typeof instance.componentWillUnmount &&
            safelyCallComponentWillUnmount(fiber, fiber.return, instance);
      }
    }
    function invokePassiveEffectUnmountInDEV(fiber) {
      switch (fiber.tag) {
        case 0:
        case 11:
        case 15:
          commitHookEffectListUnmount(Passive | HasEffect, fiber, fiber.return);
      }
    }
    function isLegacyActEnvironment() {
      var isReactActEnvironmentGlobal =
        "undefined" !== typeof IS_REACT_ACT_ENVIRONMENT
          ? IS_REACT_ACT_ENVIRONMENT
          : void 0;
      return "undefined" !== typeof jest && !1 !== isReactActEnvironmentGlobal;
    }
    function isConcurrentActEnvironment() {
      var isReactActEnvironmentGlobal =
        "undefined" !== typeof IS_REACT_ACT_ENVIRONMENT
          ? IS_REACT_ACT_ENVIRONMENT
          : void 0;
      isReactActEnvironmentGlobal ||
        null === ReactSharedInternals.actQueue ||
        error$jscomp$0(
          "The current testing environment is not configured to support act(...)"
        );
      return isReactActEnvironmentGlobal;
    }
    function requestUpdateLane(fiber) {
      if (0 === (fiber.mode & 1)) return 2;
      if (
        (executionContext & RenderContext) !== NoContext &&
        0 !== workInProgressRootRenderLanes
      )
        return workInProgressRootRenderLanes & -workInProgressRootRenderLanes;
      var transition = ReactSharedInternals.T;
      if (null !== transition)
        return (
          transition._updatedFibers || (transition._updatedFibers = new Set()),
          transition._updatedFibers.add(fiber),
          (fiber = currentEntangledLane),
          0 !== fiber ? fiber : requestTransitionLane()
        );
      fiber =
        0 !== currentUpdatePriority
          ? currentUpdatePriority
          : DefaultEventPriority;
      return fiber;
    }
    function requestDeferredLane() {
      0 === workInProgressDeferredLane &&
        (workInProgressDeferredLane =
          0 !== (workInProgressRootRenderLanes & 536870912)
            ? 536870912
            : claimNextTransitionLane());
      var suspenseHandler = suspenseHandlerStackCursor.current;
      null !== suspenseHandler && (suspenseHandler.flags |= 32);
      return workInProgressDeferredLane;
    }
    function scheduleUpdateOnFiber(root, fiber, lane) {
      isRunningInsertionEffect &&
        error$jscomp$0("useInsertionEffect must not schedule updates.");
      isFlushingPassiveEffects && (didScheduleUpdateDuringPassiveEffects = !0);
      if (
        (root === workInProgressRoot &&
          workInProgressSuspendedReason === SuspendedOnData) ||
        null !== root.cancelPendingCommit
      )
        prepareFreshStack(root, 0),
          markRootSuspended(
            root,
            workInProgressRootRenderLanes,
            workInProgressDeferredLane
          );
      markRootUpdated$1(root, lane);
      if (
        0 !== (executionContext & RenderContext) &&
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
                (fiber = getComponentNameFromFiber(fiber) || "Unknown"),
                error$jscomp$0(
                  "Cannot update a component (`%s`) while rendering a different component (`%s`). To locate the bad setState() call inside `%s`, follow the stack trace as described in https://react.dev/link/setstate-in-render",
                  fiber,
                  root,
                  root
                ));
              break;
            case 1:
              didWarnAboutUpdateInRender ||
                (error$jscomp$0(
                  "Cannot update during an existing state transition (such as within `render`). Render methods should be a pure function of props and state."
                ),
                (didWarnAboutUpdateInRender = !0));
          }
      } else
        warnIfUpdatesNotWrappedWithActDEV(fiber),
          root === workInProgressRoot &&
            ((executionContext & RenderContext) === NoContext &&
              (workInProgressRootInterleavedUpdatedLanes |= lane),
            workInProgressRootExitStatus === RootSuspendedWithDelay &&
              markRootSuspended(
                root,
                workInProgressRootRenderLanes,
                workInProgressDeferredLane
              )),
          ensureRootIsScheduled(root),
          2 !== lane ||
            executionContext !== NoContext ||
            0 !== (fiber.mode & 1) ||
            ReactSharedInternals.isBatchingLegacy ||
            ((workInProgressRootRenderTargetTime = now$1() + RENDER_TIMEOUT_MS),
            flushSyncWorkAcrossRoots_impl(0, !0));
    }
    function performWorkOnRoot(root, lanes, forceSync) {
      if ((executionContext & (RenderContext | CommitContext)) !== NoContext)
        throw Error("Should not already be working.");
      var exitStatus = (forceSync =
        !forceSync && 0 === (lanes & 60) && 0 === (lanes & root.expiredLanes))
        ? renderRootConcurrent(root, lanes)
        : renderRootSync(root, lanes);
      if (exitStatus !== RootInProgress) {
        var renderWasConcurrent = forceSync;
        do {
          if (exitStatus === RootDidNotComplete)
            markRootSuspended(root, lanes, 0);
          else {
            forceSync = root.current.alternate;
            if (
              renderWasConcurrent &&
              !isRenderConsistentWithExternalStores(forceSync)
            ) {
              exitStatus = renderRootSync(root, lanes);
              renderWasConcurrent = !1;
              continue;
            }
            if (0 !== root.tag && exitStatus === RootErrored) {
              var lanesThatJustErrored = lanes;
              root.errorRecoveryDisabledLanes & lanesThatJustErrored
                ? (renderWasConcurrent = 0)
                : ((renderWasConcurrent = root.pendingLanes & -536870913),
                  (renderWasConcurrent =
                    0 !== renderWasConcurrent
                      ? renderWasConcurrent
                      : renderWasConcurrent & 536870912
                        ? 536870912
                        : 0));
              if (0 !== renderWasConcurrent) {
                lanes = renderWasConcurrent;
                a: {
                  exitStatus = root;
                  var originallyAttemptedLanes = lanesThatJustErrored;
                  lanesThatJustErrored = workInProgressRootConcurrentErrors;
                  renderWasConcurrent = renderRootSync(
                    exitStatus,
                    renderWasConcurrent
                  );
                  if (renderWasConcurrent !== RootErrored) {
                    if (workInProgressRootDidAttachPingListener) {
                      exitStatus.errorRecoveryDisabledLanes |=
                        originallyAttemptedLanes;
                      workInProgressRootInterleavedUpdatedLanes |=
                        originallyAttemptedLanes;
                      exitStatus = RootSuspendedWithDelay;
                      break a;
                    }
                    exitStatus = workInProgressRootRecoverableErrors;
                    workInProgressRootRecoverableErrors = lanesThatJustErrored;
                    null !== exitStatus && queueRecoverableErrors(exitStatus);
                  }
                  exitStatus = renderWasConcurrent;
                }
                renderWasConcurrent = !1;
                if (exitStatus !== RootErrored) continue;
              }
            }
            if (exitStatus === RootFatalErrored) {
              prepareFreshStack(root, 0);
              markRootSuspended(root, lanes, 0);
              break;
            }
            a: {
              renderWasConcurrent = root;
              switch (exitStatus) {
                case RootInProgress:
                case RootFatalErrored:
                  throw Error("Root did not complete. This is a bug in React.");
                case RootSuspendedWithDelay:
                  if ((lanes & 4194176) === lanes) {
                    markRootSuspended(
                      renderWasConcurrent,
                      lanes,
                      workInProgressDeferredLane
                    );
                    break a;
                  }
                  break;
                case RootErrored:
                  workInProgressRootRecoverableErrors = null;
                  break;
                case RootSuspended:
                case RootCompleted:
                  break;
                default:
                  throw Error("Unknown root exit status.");
              }
              renderWasConcurrent.finishedWork = forceSync;
              renderWasConcurrent.finishedLanes = lanes;
              if (null !== ReactSharedInternals.actQueue) {
                lanes = renderWasConcurrent;
                forceSync = workInProgressRootRecoverableErrors;
                exitStatus = workInProgressTransitions;
                renderWasConcurrent =
                  workInProgressRootDidIncludeRecursiveRenderUpdate;
                lanesThatJustErrored = workInProgressDeferredLane;
                originallyAttemptedLanes =
                  workInProgressRootInterleavedUpdatedLanes;
                var suspendedRetryLanes = workInProgressSuspendedRetryLanes,
                  suspendedCommitReason = IMMEDIATE_COMMIT,
                  prevTransition = ReactSharedInternals.T,
                  previousUpdateLanePriority = currentUpdatePriority;
                try {
                  (currentUpdatePriority = DiscreteEventPriority),
                    (ReactSharedInternals.T = null),
                    commitRootImpl(
                      lanes,
                      forceSync,
                      exitStatus,
                      renderWasConcurrent,
                      previousUpdateLanePriority,
                      lanesThatJustErrored,
                      originallyAttemptedLanes,
                      suspendedRetryLanes,
                      suspendedCommitReason,
                      -0,
                      0
                    );
                } finally {
                  (ReactSharedInternals.T = prevTransition),
                    (currentUpdatePriority = previousUpdateLanePriority);
                }
              } else {
                if (
                  (lanes & 62914560) === lanes &&
                  exitStatus === RootSuspended &&
                  ((exitStatus =
                    globalMostRecentFallbackTime +
                    FALLBACK_THROTTLE_MS -
                    now$1()),
                  10 < exitStatus)
                ) {
                  markRootSuspended(
                    renderWasConcurrent,
                    lanes,
                    workInProgressDeferredLane
                  );
                  if (0 !== getNextLanes(renderWasConcurrent, 0)) break a;
                  renderWasConcurrent.timeoutHandle = scheduleTimeout(
                    commitRootWhenReady.bind(
                      null,
                      renderWasConcurrent,
                      forceSync,
                      workInProgressRootRecoverableErrors,
                      workInProgressTransitions,
                      workInProgressRootDidIncludeRecursiveRenderUpdate,
                      lanes,
                      workInProgressDeferredLane,
                      workInProgressRootInterleavedUpdatedLanes,
                      workInProgressSuspendedRetryLanes,
                      workInProgressRootDidSkipSuspendedSiblings,
                      THROTTLED_COMMIT,
                      -0,
                      0
                    ),
                    exitStatus
                  );
                  break a;
                }
                commitRootWhenReady(
                  renderWasConcurrent,
                  forceSync,
                  workInProgressRootRecoverableErrors,
                  workInProgressTransitions,
                  workInProgressRootDidIncludeRecursiveRenderUpdate,
                  lanes,
                  workInProgressDeferredLane,
                  workInProgressRootInterleavedUpdatedLanes,
                  workInProgressSuspendedRetryLanes,
                  workInProgressRootDidSkipSuspendedSiblings,
                  IMMEDIATE_COMMIT,
                  -0,
                  0
                );
              }
            }
          }
          break;
        } while (1);
      }
      ensureRootIsScheduled(root);
    }
    function queueRecoverableErrors(errors) {
      null === workInProgressRootRecoverableErrors
        ? (workInProgressRootRecoverableErrors = errors)
        : workInProgressRootRecoverableErrors.push.apply(
            workInProgressRootRecoverableErrors,
            errors
          );
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
      suspendedCommitReason,
      completedRenderStartTime,
      completedRenderEndTime
    ) {
      lanes = finishedWork.subtreeFlags;
      (lanes & 8192 || 16785408 === (lanes & 16785408)) &&
        accumulateSuspenseyCommitOnFiber(finishedWork);
      finishedWork = ReactSharedInternals.T;
      lanes = currentUpdatePriority;
      try {
        (currentUpdatePriority = DiscreteEventPriority),
          (ReactSharedInternals.T = null),
          commitRootImpl(
            root,
            recoverableErrors,
            transitions,
            didIncludeRenderPhaseUpdate,
            lanes,
            spawnedLane,
            updatedLanes,
            suspendedRetryLanes,
            suspendedCommitReason,
            completedRenderStartTime,
            completedRenderEndTime
          );
      } finally {
        (ReactSharedInternals.T = finishedWork),
          (currentUpdatePriority = lanes);
      }
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
            } catch (error$32) {
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
    function markRootSuspended(root, suspendedLanes, spawnedLane) {
      suspendedLanes &= ~workInProgressRootPingedLanes;
      suspendedLanes &= ~workInProgressRootInterleavedUpdatedLanes;
      root.suspendedLanes |= suspendedLanes;
      root.pingedLanes &= ~suspendedLanes;
      for (
        var expirationTimes = root.expirationTimes, lanes = suspendedLanes;
        0 < lanes;

      ) {
        var index = 31 - clz32(lanes),
          lane = 1 << index;
        expirationTimes[index] = -1;
        lanes &= ~lane;
      }
      0 !== spawnedLane &&
        markSpawnedDeferredLane(root, spawnedLane, suspendedLanes);
    }
    function flushSyncFromReconciler(fn) {
      null !== rootWithPendingPassiveEffects &&
        0 === rootWithPendingPassiveEffects.tag &&
        (executionContext & (RenderContext | CommitContext)) === NoContext &&
        flushPassiveEffects();
      var prevExecutionContext = executionContext;
      executionContext |= 1;
      var prevTransition = ReactSharedInternals.T,
        previousPriority = currentUpdatePriority;
      try {
        if (
          ((currentUpdatePriority = DiscreteEventPriority),
          (ReactSharedInternals.T = null),
          fn)
        )
          return fn();
      } finally {
        (currentUpdatePriority = previousPriority),
          (ReactSharedInternals.T = prevTransition),
          (executionContext = prevExecutionContext),
          (executionContext & (RenderContext | CommitContext)) === NoContext &&
            flushSyncWorkAcrossRoots_impl(0, !1);
      }
    }
    function flushSyncWork() {
      return (executionContext & (RenderContext | CommitContext)) === NoContext
        ? (flushSyncWorkAcrossRoots_impl(0, !1), !1)
        : !0;
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
    function prepareFreshStack(root, lanes) {
      root.finishedWork = null;
      root.finishedLanes = 0;
      var timeoutHandle = root.timeoutHandle;
      -1 !== timeoutHandle &&
        ((root.timeoutHandle = -1), cancelTimeout(timeoutHandle));
      timeoutHandle = root.cancelPendingCommit;
      null !== timeoutHandle &&
        ((root.cancelPendingCommit = null), timeoutHandle());
      resetWorkInProgressStack();
      workInProgressRoot = root;
      workInProgress = timeoutHandle = createWorkInProgress(root.current, null);
      workInProgressRootRenderLanes = lanes;
      workInProgressSuspendedReason = NotSuspended;
      workInProgressThrownValue = null;
      workInProgressRootDidAttachPingListener =
        workInProgressRootDidSkipSuspendedSiblings = !1;
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
      var allEntangledLanes = root.entangledLanes;
      if (0 !== allEntangledLanes)
        for (
          root = root.entanglements, allEntangledLanes &= lanes;
          0 < allEntangledLanes;

        ) {
          var index = 31 - clz32(allEntangledLanes),
            lane = 1 << index;
          lanes |= root[index];
          allEntangledLanes &= ~lane;
        }
      entangledRenderLanes = lanes;
      finishQueueingConcurrentUpdates();
      ReactStrictModeWarnings.discardPendingWarnings();
      return timeoutHandle;
    }
    function handleThrow(root, thrownValue) {
      currentlyRenderingFiber$1 = null;
      ReactSharedInternals.H = ContextOnlyDispatcher;
      ReactSharedInternals.getCurrentStack = null;
      isRendering = !1;
      current = null;
      if (thrownValue === SuspenseException) {
        thrownValue = getSuspendedThenable();
        var handler = suspenseHandlerStackCursor.current;
        workInProgressSuspendedReason =
          (null !== handler &&
            ((workInProgressRootRenderLanes & 4194176) ===
            workInProgressRootRenderLanes
              ? null !== shellBoundary
              : ((workInProgressRootRenderLanes & 62914560) !==
                  workInProgressRootRenderLanes &&
                  0 === (workInProgressRootRenderLanes & 536870912)) ||
                handler !== shellBoundary)) ||
          0 !== (workInProgressRootSkippedLanes & 134217727) ||
          0 !== (workInProgressRootInterleavedUpdatedLanes & 134217727)
            ? SuspendedOnImmediate
            : SuspendedOnData;
      } else
        thrownValue === SuspenseyCommitException
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
      handler = workInProgress;
      if (null === handler)
        (workInProgressRootExitStatus = RootFatalErrored),
          logUncaughtError(
            root,
            createCapturedValueAtFiber(thrownValue, root.current)
          );
      else
        switch (
          (handler.mode & 2 &&
            stopProfilerTimerIfRunningAndRecordDuration(handler),
          markComponentRenderStopped(),
          workInProgressSuspendedReason)
        ) {
          case SuspendedOnError:
            null !== injectedProfilingHooks &&
              "function" ===
                typeof injectedProfilingHooks.markComponentErrored &&
              injectedProfilingHooks.markComponentErrored(
                handler,
                thrownValue,
                workInProgressRootRenderLanes
              );
            break;
          case SuspendedOnData:
          case SuspendedOnImmediate:
          case SuspendedOnDeprecatedThrowPromise:
          case SuspendedAndReadyToContinue:
            null !== injectedProfilingHooks &&
              "function" ===
                typeof injectedProfilingHooks.markComponentSuspended &&
              injectedProfilingHooks.markComponentSuspended(
                handler,
                thrownValue,
                workInProgressRootRenderLanes
              );
        }
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
      workInProgressRootExitStatus = RootSuspendedWithDelay;
      (0 === (workInProgressRootSkippedLanes & 134217727) &&
        0 === (workInProgressRootInterleavedUpdatedLanes & 134217727)) ||
        null === workInProgressRoot ||
        markRootSuspended(
          workInProgressRoot,
          workInProgressRootRenderLanes,
          workInProgressDeferredLane
        );
    }
    function renderRootSync(root, lanes) {
      var prevExecutionContext = executionContext;
      executionContext |= RenderContext;
      var prevDispatcher = pushDispatcher(),
        prevAsyncDispatcher = pushAsyncDispatcher();
      if (
        workInProgressRoot !== root ||
        workInProgressRootRenderLanes !== lanes
      )
        (workInProgressTransitions = null), prepareFreshStack(root, lanes);
      markRenderStarted(lanes);
      lanes = !1;
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
                workInProgressRootExitStatus = RootDidNotComplete;
                break a;
              case SuspendedOnImmediate:
              case SuspendedOnData:
                lanes ||
                  null !== suspenseHandlerStackCursor.current ||
                  (lanes = !0);
              default:
                var reason = workInProgressSuspendedReason;
                workInProgressSuspendedReason = NotSuspended;
                workInProgressThrownValue = null;
                throwAndUnwindWorkLoop(root, unitOfWork, thrownValue, reason);
            }
          }
          workLoopSync();
          break;
        } catch (thrownValue$33) {
          handleThrow(root, thrownValue$33);
        }
      while (1);
      lanes && root.shellSuspendCounter++;
      resetContextDependencies();
      executionContext = prevExecutionContext;
      ReactSharedInternals.H = prevDispatcher;
      ReactSharedInternals.A = prevAsyncDispatcher;
      if (null !== workInProgress)
        throw Error(
          "Cannot commit an incomplete root. This error is likely caused by a bug in React. Please file an issue."
        );
      markRenderStopped();
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
      executionContext |= RenderContext;
      var prevDispatcher = pushDispatcher(),
        prevAsyncDispatcher = pushAsyncDispatcher();
      if (
        workInProgressRoot !== root ||
        workInProgressRootRenderLanes !== lanes
      )
        (workInProgressTransitions = null),
          (workInProgressRootRenderTargetTime = now$1() + RENDER_TIMEOUT_MS),
          prepareFreshStack(root, lanes);
      markRenderStarted(lanes);
      a: do
        try {
          if (
            workInProgressSuspendedReason !== NotSuspended &&
            null !== workInProgress
          ) {
            lanes = workInProgress;
            var thrownValue = workInProgressThrownValue;
            b: switch (workInProgressSuspendedReason) {
              case SuspendedOnError:
                workInProgressSuspendedReason = NotSuspended;
                workInProgressThrownValue = null;
                throwAndUnwindWorkLoop(
                  root,
                  lanes,
                  thrownValue,
                  SuspendedOnError
                );
                break;
              case SuspendedOnData:
                if (isThenableResolved(thrownValue)) {
                  workInProgressSuspendedReason = NotSuspended;
                  workInProgressThrownValue = null;
                  replaySuspendedUnitOfWork(lanes);
                  break;
                }
                lanes = function () {
                  workInProgressSuspendedReason === SuspendedOnData &&
                    workInProgressRoot === root &&
                    (workInProgressSuspendedReason =
                      SuspendedAndReadyToContinue);
                  ensureRootIsScheduled(root);
                };
                thrownValue.then(lanes, lanes);
                break a;
              case SuspendedOnImmediate:
                workInProgressSuspendedReason = SuspendedAndReadyToContinue;
                break a;
              case SuspendedOnInstance:
                workInProgressSuspendedReason =
                  SuspendedOnInstanceAndReadyToContinue;
                break a;
              case SuspendedAndReadyToContinue:
                isThenableResolved(thrownValue)
                  ? ((workInProgressSuspendedReason = NotSuspended),
                    (workInProgressThrownValue = null),
                    replaySuspendedUnitOfWork(lanes))
                  : ((workInProgressSuspendedReason = NotSuspended),
                    (workInProgressThrownValue = null),
                    throwAndUnwindWorkLoop(
                      root,
                      lanes,
                      thrownValue,
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
                    var hostFiber = workInProgress;
                    if (resource ? preloadResource(resource) : 1) {
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
                    error$jscomp$0(
                      "Unexpected type of fiber triggered a suspensey commit. This is a bug in React."
                    );
                }
                workInProgressSuspendedReason = NotSuspended;
                workInProgressThrownValue = null;
                throwAndUnwindWorkLoop(
                  root,
                  lanes,
                  thrownValue,
                  SuspendedOnInstanceAndReadyToContinue
                );
                break;
              case SuspendedOnDeprecatedThrowPromise:
                workInProgressSuspendedReason = NotSuspended;
                workInProgressThrownValue = null;
                throwAndUnwindWorkLoop(
                  root,
                  lanes,
                  thrownValue,
                  SuspendedOnDeprecatedThrowPromise
                );
                break;
              case SuspendedOnHydration:
                resetWorkInProgressStack();
                workInProgressRootExitStatus = RootDidNotComplete;
                break a;
              default:
                throw Error(
                  "Unexpected SuspendedReason. This is a bug in React."
                );
            }
          }
          null !== ReactSharedInternals.actQueue
            ? workLoopSync()
            : workLoopConcurrent();
          break;
        } catch (thrownValue$34) {
          handleThrow(root, thrownValue$34);
        }
      while (1);
      resetContextDependencies();
      ReactSharedInternals.H = prevDispatcher;
      ReactSharedInternals.A = prevAsyncDispatcher;
      executionContext = prevExecutionContext;
      if (null !== workInProgress)
        return (
          null !== injectedProfilingHooks &&
            "function" === typeof injectedProfilingHooks.markRenderYielded &&
            injectedProfilingHooks.markRenderYielded(),
          RootInProgress
        );
      markRenderStopped();
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
      var current = unitOfWork.alternate;
      0 !== (unitOfWork.mode & 2)
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
        isProfilingMode = 0 !== (unitOfWork.mode & 2);
      isProfilingMode && startProfilerTimer(unitOfWork);
      switch (unitOfWork.tag) {
        case 15:
        case 0:
          var Component = unitOfWork.type,
            resolvedProps = unitOfWork.pendingProps;
          var context = isContextProvider(Component)
            ? previousContext
            : contextStackCursor$1.current;
          context = getMaskedContext(unitOfWork, context);
          current = replayFunctionComponent(
            current,
            unitOfWork,
            resolvedProps,
            Component,
            context,
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
    function throwAndUnwindWorkLoop(root, unitOfWork, thrownValue) {
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
      } catch (error$35) {
        if (null !== returnFiber)
          throw ((workInProgress = returnFiber), error$35);
        workInProgressRootExitStatus = RootFatalErrored;
        logUncaughtError(
          root,
          createCapturedValueAtFiber(thrownValue, root.current)
        );
        workInProgress = null;
        return;
      }
      unitOfWork.flags & 32768
        ? unwindUnitOfWork(unitOfWork, !0)
        : completeUnitOfWork(unitOfWork);
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
        if (0 !== (unitOfWork.mode & 2)) {
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
      workInProgressRootExitStatus = RootDidNotComplete;
      workInProgress = null;
    }
    function commitRootImpl(
      root,
      recoverableErrors,
      transitions,
      didIncludeRenderPhaseUpdate,
      renderPriorityLevel,
      spawnedLane
    ) {
      do flushPassiveEffects();
      while (null !== rootWithPendingPassiveEffects);
      ReactStrictModeWarnings.flushLegacyContextWarning();
      ReactStrictModeWarnings.flushPendingUnsafeLifecycleWarnings();
      if ((executionContext & (RenderContext | CommitContext)) !== NoContext)
        throw Error("Should not already be working.");
      var finishedWork = root.finishedWork;
      didIncludeRenderPhaseUpdate = root.finishedLanes;
      null !== injectedProfilingHooks &&
        "function" === typeof injectedProfilingHooks.markCommitStarted &&
        injectedProfilingHooks.markCommitStarted(didIncludeRenderPhaseUpdate);
      if (null === finishedWork) return markCommitStopped(), null;
      0 === didIncludeRenderPhaseUpdate &&
        error$jscomp$0(
          "root.finishedLanes should not be empty during a commit. This is a bug in React."
        );
      root.finishedWork = null;
      root.finishedLanes = 0;
      if (finishedWork === root.current)
        throw Error(
          "Cannot commit the same tree as before. This error is likely caused by a bug in React. Please file an issue."
        );
      root.callbackNode = null;
      root.callbackPriority = 0;
      root.cancelPendingCommit = null;
      var remainingLanes = finishedWork.lanes | finishedWork.childLanes;
      remainingLanes |= concurrentlyUpdatedLanes;
      markRootFinished(
        root,
        didIncludeRenderPhaseUpdate,
        remainingLanes,
        spawnedLane
      );
      root === workInProgressRoot &&
        ((workInProgress = workInProgressRoot = null),
        (workInProgressRootRenderLanes = 0));
      (0 === (finishedWork.subtreeFlags & 10256) &&
        0 === (finishedWork.flags & 10256)) ||
        rootDoesHavePassiveEffects ||
        ((rootDoesHavePassiveEffects = !0),
        (pendingPassiveEffectsRemainingLanes = remainingLanes),
        (pendingPassiveTransitions = transitions),
        scheduleCallback(NormalPriority$1, function () {
          flushPassiveEffects(!0);
          return null;
        }));
      commitStartTime = now();
      transitions = 0 !== (finishedWork.flags & 15990);
      if (0 !== (finishedWork.subtreeFlags & 15990) || transitions) {
        transitions = ReactSharedInternals.T;
        ReactSharedInternals.T = null;
        spawnedLane = currentUpdatePriority;
        currentUpdatePriority = DiscreteEventPriority;
        var prevExecutionContext = executionContext;
        executionContext |= CommitContext;
        commitBeforeMutationEffects(root, finishedWork);
        commitMutationEffectsOnFiber(finishedWork, root);
        root.current = finishedWork;
        null !== injectedProfilingHooks &&
          "function" ===
            typeof injectedProfilingHooks.markLayoutEffectsStarted &&
          injectedProfilingHooks.markLayoutEffectsStarted(
            didIncludeRenderPhaseUpdate
          );
        commitLayoutEffectOnFiber(root, finishedWork.alternate, finishedWork);
        null !== injectedProfilingHooks &&
          "function" ===
            typeof injectedProfilingHooks.markLayoutEffectsStopped &&
          injectedProfilingHooks.markLayoutEffectsStopped();
        requestPaint();
        executionContext = prevExecutionContext;
        currentUpdatePriority = spawnedLane;
        ReactSharedInternals.T = transitions;
      } else root.current = finishedWork;
      (transitions = rootDoesHavePassiveEffects)
        ? ((rootDoesHavePassiveEffects = !1),
          (rootWithPendingPassiveEffects = root),
          (pendingPassiveEffectsLanes = didIncludeRenderPhaseUpdate))
        : (releaseRootPooledCache(root, remainingLanes),
          (nestedPassiveUpdateCount = 0),
          (rootWithPassiveNestedUpdates = null));
      remainingLanes = root.pendingLanes;
      0 === remainingLanes && (legacyErrorBoundariesThatAlreadyFailed = null);
      transitions || commitDoubleInvokeEffectsInDEV(root, !1);
      onCommitRoot(finishedWork.stateNode, renderPriorityLevel);
      ensureRootIsScheduled(root);
      if (null !== recoverableErrors)
        for (
          renderPriorityLevel = root.onRecoverableError, finishedWork = 0;
          finishedWork < recoverableErrors.length;
          finishedWork++
        )
          (remainingLanes = recoverableErrors[finishedWork]),
            (transitions = makeErrorInfo(remainingLanes.stack)),
            runWithFiberInDEV(
              remainingLanes.source,
              renderPriorityLevel,
              remainingLanes.value,
              transitions
            );
      0 !== (pendingPassiveEffectsLanes & 3) &&
        0 !== root.tag &&
        flushPassiveEffects();
      remainingLanes = root.pendingLanes;
      0 !== (didIncludeRenderPhaseUpdate & 4194218) &&
      0 !== (remainingLanes & 42)
        ? ((nestedUpdateScheduled = !0),
          root === rootWithNestedUpdates
            ? nestedUpdateCount++
            : ((nestedUpdateCount = 0), (rootWithNestedUpdates = root)))
        : (nestedUpdateCount = 0);
      flushSyncWorkAcrossRoots_impl(0, !1);
      markCommitStopped();
      return null;
    }
    function makeErrorInfo(componentStack) {
      componentStack = { componentStack: componentStack };
      Object.defineProperty(componentStack, "digest", {
        get: function () {
          error$jscomp$0(
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
    function flushPassiveEffects() {
      if (null !== rootWithPendingPassiveEffects) {
        var root = rootWithPendingPassiveEffects,
          remainingLanes = pendingPassiveEffectsRemainingLanes;
        pendingPassiveEffectsRemainingLanes = 0;
        var renderPriority = lanesToEventPriority(pendingPassiveEffectsLanes),
          priority =
            0 === DefaultEventPriority || DefaultEventPriority > renderPriority
              ? DefaultEventPriority
              : renderPriority;
        renderPriority = ReactSharedInternals.T;
        var previousPriority = currentUpdatePriority;
        try {
          currentUpdatePriority = priority;
          ReactSharedInternals.T = null;
          if (null === rootWithPendingPassiveEffects)
            var JSCompiler_inline_result = !1;
          else {
            priority = pendingPassiveTransitions;
            pendingPassiveTransitions = null;
            var root$jscomp$0 = rootWithPendingPassiveEffects,
              lanes = pendingPassiveEffectsLanes;
            rootWithPendingPassiveEffects = null;
            pendingPassiveEffectsLanes = 0;
            if (
              (executionContext & (RenderContext | CommitContext)) !==
              NoContext
            )
              throw Error(
                "Cannot flush passive effects while already rendering."
              );
            isFlushingPassiveEffects = !0;
            didScheduleUpdateDuringPassiveEffects = !1;
            null !== injectedProfilingHooks &&
              "function" ===
                typeof injectedProfilingHooks.markPassiveEffectsStarted &&
              injectedProfilingHooks.markPassiveEffectsStarted(lanes);
            var prevExecutionContext = executionContext;
            executionContext |= CommitContext;
            commitPassiveUnmountOnFiber(root$jscomp$0.current);
            commitPassiveMountOnFiber(
              root$jscomp$0,
              root$jscomp$0.current,
              lanes,
              priority
            );
            null !== injectedProfilingHooks &&
              "function" ===
                typeof injectedProfilingHooks.markPassiveEffectsStopped &&
              injectedProfilingHooks.markPassiveEffectsStopped();
            commitDoubleInvokeEffectsInDEV(root$jscomp$0, !0);
            executionContext = prevExecutionContext;
            flushSyncWorkAcrossRoots_impl(0, !1);
            didScheduleUpdateDuringPassiveEffects
              ? root$jscomp$0 === rootWithPassiveNestedUpdates
                ? nestedPassiveUpdateCount++
                : ((nestedPassiveUpdateCount = 0),
                  (rootWithPassiveNestedUpdates = root$jscomp$0))
              : (nestedPassiveUpdateCount = 0);
            didScheduleUpdateDuringPassiveEffects = isFlushingPassiveEffects =
              !1;
            if (
              injectedHook &&
              "function" === typeof injectedHook.onPostCommitFiberRoot
            )
              try {
                injectedHook.onPostCommitFiberRoot(rendererID, root$jscomp$0);
              } catch (err) {
                hasLoggedError ||
                  ((hasLoggedError = !0),
                  error$jscomp$0(
                    "React instrumentation encountered an error: %s",
                    err
                  ));
              }
            var stateNode = root$jscomp$0.current.stateNode;
            stateNode.effectDuration = 0;
            stateNode.passiveEffectDuration = 0;
            JSCompiler_inline_result = !0;
          }
          return JSCompiler_inline_result;
        } finally {
          (currentUpdatePriority = previousPriority),
            (ReactSharedInternals.T = renderPriority),
            releaseRootPooledCache(root, remainingLanes);
        }
      }
      return !1;
    }
    function captureCommitPhaseErrorOnRoot(rootFiber, sourceFiber, error) {
      sourceFiber = createCapturedValueAtFiber(error, sourceFiber);
      sourceFiber = createRootErrorUpdate(rootFiber.stateNode, sourceFiber, 2);
      rootFiber = enqueueUpdate(rootFiber, sourceFiber, 2);
      null !== rootFiber &&
        (markRootUpdated$1(rootFiber, 2), ensureRootIsScheduled(rootFiber));
    }
    function captureCommitPhaseError(
      sourceFiber,
      nearestMountedAncestor,
      error$1
    ) {
      isRunningInsertionEffect = !1;
      if (3 === sourceFiber.tag)
        captureCommitPhaseErrorOnRoot(sourceFiber, sourceFiber, error$1);
      else {
        for (; null !== nearestMountedAncestor; ) {
          if (3 === nearestMountedAncestor.tag) {
            captureCommitPhaseErrorOnRoot(
              nearestMountedAncestor,
              sourceFiber,
              error$1
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
              sourceFiber = createCapturedValueAtFiber(error$1, sourceFiber);
              error$1 = createClassErrorUpdate(2);
              instance = enqueueUpdate(nearestMountedAncestor, error$1, 2);
              null !== instance &&
                (initializeClassErrorUpdate(
                  error$1,
                  instance,
                  nearestMountedAncestor,
                  sourceFiber
                ),
                markRootUpdated$1(instance, 2),
                ensureRootIsScheduled(instance));
              return;
            }
          }
          nearestMountedAncestor = nearestMountedAncestor.return;
        }
        error$jscomp$0(
          "Internal React error: Attempted to capture a commit phase error inside a detached tree. This indicates a bug in React. Potential causes include deleting the same fiber more than once, committing an already-finished tree, or an inconsistent return pointer.\n\nError message:\n\n%s",
          error$1
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
        (root = pingSuspendedRoot.bind(null, root, wakeable, lanes)),
        wakeable.then(root, root));
    }
    function pingSuspendedRoot(root, wakeable, pingedLanes) {
      var pingCache = root.pingCache;
      null !== pingCache && pingCache.delete(wakeable);
      root.pingedLanes |= root.suspendedLanes & pingedLanes;
      root.warmLanes &= ~pingedLanes;
      0 !== root.tag &&
        isConcurrentActEnvironment() &&
        null === ReactSharedInternals.actQueue &&
        error$jscomp$0(
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
    function recursivelyTraverseAndDoubleInvokeEffectsInDEV(
      root$jscomp$0,
      parentFiber,
      isInStrictMode
    ) {
      if (0 !== (parentFiber.subtreeFlags & 33562624))
        for (parentFiber = parentFiber.child; null !== parentFiber; ) {
          var root = root$jscomp$0,
            fiber = parentFiber,
            isStrictModeFiber = fiber.type === REACT_STRICT_MODE_TYPE;
          isStrictModeFiber = isInStrictMode || isStrictModeFiber;
          22 !== fiber.tag
            ? fiber.flags & 33554432
              ? isStrictModeFiber &&
                runWithFiberInDEV(
                  fiber,
                  doubleInvokeEffectsOnFiber,
                  root,
                  fiber,
                  0 === (fiber.mode & 64)
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
                : fiber.subtreeFlags & 33554432 &&
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
      var shouldDoubleInvokePassiveEffects =
        2 < arguments.length && void 0 !== arguments[2] ? arguments[2] : !0;
      setIsStrictModeForDevtools(!0);
      disappearLayoutEffects(fiber);
      shouldDoubleInvokePassiveEffects && disconnectPassiveEffect(fiber);
      reappearLayoutEffects(root, fiber.alternate, fiber, !1);
      shouldDoubleInvokePassiveEffects &&
        reconnectPassiveEffects(root, fiber, 0, null, !1);
      setIsStrictModeForDevtools(!1);
    }
    function commitDoubleInvokeEffectsInDEV(root, hasPassiveEffects) {
      0 !== root.tag
        ? ((hasPassiveEffects = !0),
          1 !== root.tag || root.current.mode & 24 || (hasPassiveEffects = !1),
          recursivelyTraverseAndDoubleInvokeEffectsInDEV(
            root,
            root.current,
            hasPassiveEffects
          ))
        : runWithFiberInDEV(
            root.current,
            legacyCommitDoubleInvokeEffectsInDEV,
            root.current,
            hasPassiveEffects
          );
    }
    function legacyCommitDoubleInvokeEffectsInDEV(fiber, hasPassiveEffects) {
      invokeEffectsInDev(fiber, 67108864, invokeLayoutEffectUnmountInDEV);
      hasPassiveEffects &&
        invokeEffectsInDev(fiber, 134217728, invokePassiveEffectUnmountInDEV);
      invokeEffectsInDev(fiber, 67108864, invokeLayoutEffectMountInDEV);
      hasPassiveEffects &&
        invokeEffectsInDev(fiber, 134217728, invokePassiveEffectMountInDEV);
    }
    function invokeEffectsInDev(firstChild, fiberFlags, invokeEffectFn) {
      for (var subtreeRoot = null; null != firstChild; ) {
        var primarySubtreeFlag = firstChild.subtreeFlags & fiberFlags;
        firstChild !== subtreeRoot &&
        null != firstChild.child &&
        0 !== primarySubtreeFlag
          ? (firstChild = firstChild.child)
          : (0 !== (firstChild.flags & fiberFlags) &&
              invokeEffectFn(firstChild),
            (firstChild =
              null !== firstChild.sibling
                ? firstChild.sibling
                : (subtreeRoot = firstChild.return)));
      }
    }
    function warnAboutUpdateOnNotYetMountedFiberInDEV(fiber) {
      if ((executionContext & RenderContext) === NoContext && fiber.mode & 1) {
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
            error$jscomp$0(
              "Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously later calls tries to update the component. Move this work to useEffect instead."
            );
          });
        }
      }
    }
    function scheduleCallback(priorityLevel, callback) {
      var actQueue = ReactSharedInternals.actQueue;
      return null !== actQueue
        ? (actQueue.push(callback), fakeActCallbackNode)
        : scheduleCallback$3(priorityLevel, callback);
    }
    function warnIfUpdatesNotWrappedWithActDEV(fiber) {
      if (fiber.mode & 1) {
        if (!isConcurrentActEnvironment()) return;
      } else if (
        !isLegacyActEnvironment() ||
        executionContext !== NoContext ||
        (0 !== fiber.tag && 11 !== fiber.tag && 15 !== fiber.tag)
      )
        return;
      null === ReactSharedInternals.actQueue &&
        runWithFiberInDEV(fiber, function () {
          error$jscomp$0(
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
      var alternate = fiber.alternate,
        child = fiber.child,
        sibling = fiber.sibling,
        tag = fiber.tag,
        type = fiber.type,
        candidateType = null;
      switch (tag) {
        case 0:
        case 15:
        case 1:
          candidateType = type;
          break;
        case 11:
          candidateType = type.render;
      }
      if (null === resolveFamily)
        throw Error("Expected resolveFamily to be set during hot reload.");
      var needsRender = !1;
      type = !1;
      null !== candidateType &&
        ((candidateType = resolveFamily(candidateType)),
        void 0 !== candidateType &&
          (staleFamilies.has(candidateType)
            ? (type = !0)
            : updatedFamilies.has(candidateType) &&
              (1 === tag ? (type = !0) : (needsRender = !0))));
      null !== failedBoundaries &&
        (failedBoundaries.has(fiber) ||
          (null !== alternate && failedBoundaries.has(alternate))) &&
        (type = !0);
      type && (fiber._debugNeedsRemount = !0);
      if (type || needsRender)
        (alternate = enqueueConcurrentRenderForLane(fiber, 2)),
          null !== alternate && scheduleUpdateOnFiber(alternate, fiber, 2);
      null === child ||
        type ||
        scheduleFibersWithFamiliesRecursively(
          child,
          updatedFamilies,
          staleFamilies
        );
      null !== sibling &&
        scheduleFibersWithFamiliesRecursively(
          sibling,
          updatedFamilies,
          staleFamilies
        );
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
      this._debugOwner = this._debugInfo = null;
      this._debugNeedsRemount = !1;
      this._debugHookTypes = null;
      hasBadMapPolyfill ||
        "function" !== typeof Object.preventExtensions ||
        Object.preventExtensions(this);
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
      workInProgress.flags = current.flags & 31457280;
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
      workInProgress.flags &= 31457282;
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
      else if ("string" === typeof type) fiberTag = 5;
      else
        a: switch (type) {
          case REACT_FRAGMENT_TYPE:
            return createFiberFromFragment(
              pendingProps.children,
              mode,
              lanes,
              key
            );
          case REACT_STRICT_MODE_TYPE:
            fiberTag = 8;
            mode |= 8;
            0 !== (mode & 1) && (mode |= 16);
            break;
          case REACT_PROFILER_TYPE:
            return (
              (type = pendingProps),
              (owner = mode),
              "string" !== typeof type.id &&
                error$jscomp$0(
                  'Profiler must specify an "id" of type `string` as a prop. Received the type `%s` instead.',
                  typeof type.id
                ),
              (key = createFiber(12, type, key, owner | 2)),
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
          case REACT_OFFSCREEN_TYPE:
            return createFiberFromOffscreen(pendingProps, mode, lanes, key);
          default:
            if ("object" === typeof type && null !== type)
              switch (type.$$typeof) {
                case REACT_PROVIDER_TYPE:
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
            resolvedType = "";
            if (
              void 0 === type ||
              ("object" === typeof type &&
                null !== type &&
                0 === Object.keys(type).length)
            )
              resolvedType +=
                " You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.";
            null === type
              ? (pendingProps = "null")
              : isArrayImpl(type)
                ? (pendingProps = "array")
                : void 0 !== type && type.$$typeof === REACT_ELEMENT_TYPE
                  ? ((pendingProps =
                      "<" +
                      (getComponentNameFromType(type.type) || "Unknown") +
                      " />"),
                    (resolvedType =
                      " Did you accidentally export a JSX literal instead of a component?"))
                  : (pendingProps = typeof type);
            fiberTag = owner
              ? "number" === typeof owner.tag
                ? getComponentNameFromFiber(owner)
                : "string" === typeof owner.name
                  ? owner.name
                  : null
              : null;
            fiberTag &&
              (resolvedType +=
                "\n\nCheck the render method of `" + fiberTag + "`.");
            fiberTag = 29;
            pendingProps = Error(
              "Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: " +
                (pendingProps + "." + resolvedType)
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
      return mode;
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
        detach: function () {
          var instance = primaryChildInstance,
            fiber = instance._current;
          if (null === fiber)
            throw Error(
              "Calling Offscreen.detach before instance handle has been set."
            );
          if (0 === (instance._pendingVisibility & 2)) {
            var root = enqueueConcurrentRenderForLane(fiber, 2);
            null !== root &&
              ((instance._pendingVisibility |= 2),
              scheduleUpdateOnFiber(root, fiber, 2));
          }
        },
        attach: function () {
          var instance = primaryChildInstance,
            fiber = instance._current;
          if (null === fiber)
            throw Error(
              "Calling Offscreen.detach before instance handle has been set."
            );
          if (0 !== (instance._pendingVisibility & 2)) {
            var root = enqueueConcurrentRenderForLane(fiber, 2);
            null !== root &&
              ((instance._pendingVisibility &= -3),
              scheduleUpdateOnFiber(root, fiber, 2));
          }
        }
      };
      pendingProps.stateNode = primaryChildInstance;
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
      onUncaughtError,
      onCaughtError,
      onRecoverableError,
      formState
    ) {
      this.tag = tag;
      this.containerInfo = containerInfo;
      this.finishedWork =
        this.pingCache =
        this.current =
        this.pendingChildren =
          null;
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
        this.finishedLanes =
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
      this.pooledCache = null;
      this.pooledCacheLanes = 0;
      this.formState = formState;
      this.incompleteTransitions = new Map();
      this.passiveEffectDuration = this.effectDuration = -0;
      switch (tag) {
        case 1:
          this._debugRootType = hydrate ? "hydrateRoot()" : "createRoot()";
          break;
        case 0:
          this._debugRootType = hydrate ? "hydrate()" : "render()";
      }
    }
    function testStringCoercion(value) {
      return "" + value;
    }
    function createContainer(
      containerInfo,
      tag,
      hydrationCallbacks,
      isStrictMode,
      concurrentUpdatesByDefaultOverride,
      identifierPrefix,
      onUncaughtError,
      onCaughtError,
      onRecoverableError
    ) {
      containerInfo = new FiberRootNode(
        containerInfo,
        tag,
        !1,
        identifierPrefix,
        onUncaughtError,
        onCaughtError,
        onRecoverableError,
        null
      );
      1 === tag ? ((tag = 1), !0 === isStrictMode && (tag |= 24)) : (tag = 0);
      isDevToolsPresent && (tag |= 2);
      isStrictMode = createFiber(3, null, null, tag);
      containerInfo.current = isStrictMode;
      isStrictMode.stateNode = containerInfo;
      tag = createCache();
      retainCache(tag);
      containerInfo.pooledCache = tag;
      retainCache(tag);
      isStrictMode.memoizedState = {
        element: null,
        isDehydrated: !1,
        cache: tag
      };
      initializeUpdateQueue(isStrictMode);
      return containerInfo;
    }
    function updateContainer(element, container, parentComponent, callback) {
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
            error$jscomp$0(
              "React instrumentation encountered an error: %s",
              err
            ));
        }
      null !== injectedProfilingHooks &&
        "function" === typeof injectedProfilingHooks.markRenderScheduled &&
        injectedProfilingHooks.markRenderScheduled(lane);
      a: if (parentComponent) {
        parentComponent = parentComponent._reactInternals;
        b: {
          if (
            getNearestMountedFiber(parentComponent) !== parentComponent ||
            1 !== parentComponent.tag
          )
            throw Error(
              "Expected subtree parent to be a mounted class component. This error is likely caused by a bug in React. Please file an issue."
            );
          var parentContext = parentComponent;
          do {
            switch (parentContext.tag) {
              case 3:
                parentContext = parentContext.stateNode.context;
                break b;
              case 1:
                if (isContextProvider(parentContext.type)) {
                  parentContext =
                    parentContext.stateNode
                      .__reactInternalMemoizedMergedChildContext;
                  break b;
                }
            }
            parentContext = parentContext.return;
          } while (null !== parentContext);
          throw Error(
            "Found unexpected detached subtree parent. This error is likely caused by a bug in React. Please file an issue."
          );
        }
        if (1 === parentComponent.tag) {
          var Component = parentComponent.type;
          if (isContextProvider(Component)) {
            parentComponent = processChildContext(
              parentComponent,
              Component,
              parentContext
            );
            break a;
          }
        }
        parentComponent = parentContext;
      } else parentComponent = emptyContextObject;
      null === container.context
        ? (container.context = parentComponent)
        : (container.pendingContext = parentComponent);
      isRendering &&
        null !== current &&
        !didWarnAboutNestedUpdates &&
        ((didWarnAboutNestedUpdates = !0),
        error$jscomp$0(
          "Render methods should be a pure function of props and state; triggering nested component updates from render is not allowed. If necessary, trigger nested updates in componentDidUpdate.\n\nCheck the render method of %s.",
          getComponentNameFromFiber(current) || "Unknown"
        ));
      container = createUpdate(lane);
      container.payload = { element: element };
      callback = void 0 === callback ? null : callback;
      null !== callback &&
        ("function" !== typeof callback &&
          error$jscomp$0(
            "Expected the last optional `callback` argument to be a function. Instead received: %s.",
            callback
          ),
        (container.callback = callback));
      element = enqueueUpdate(rootFiber, container, lane);
      null !== element &&
        (scheduleUpdateOnFiber(element, rootFiber, lane),
        entangleTransitions(element, rootFiber, lane));
    }
    function getCurrentFiberForDevTools() {
      return current;
    }
    function getLaneLabelMap() {
      for (var map = new Map(), lane = 1, index = 0; 31 > index; index++) {
        var label = getLabelForLane(lane);
        map.set(lane, label);
        lane *= 2;
      }
      return map;
    }
    function toJSON(inst) {
      if (inst.isHidden) return null;
      switch (inst.tag) {
        case "TEXT":
          return inst.text;
        case "INSTANCE":
          var props = inst.props;
          var excluded = ["children"];
          if (null == props) props = {};
          else {
            var target = {},
              sourceKeys = Object.keys(props),
              i;
            for (i = 0; i < sourceKeys.length; i++) {
              var key = sourceKeys[i];
              0 <= excluded.indexOf(key) || (target[key] = props[key]);
            }
            props = target;
          }
          excluded = null;
          if (inst.children && inst.children.length)
            for (target = 0; target < inst.children.length; target++)
              (sourceKeys = toJSON(inst.children[target])),
                null !== sourceKeys &&
                  (null === excluded
                    ? (excluded = [sourceKeys])
                    : excluded.push(sourceKeys));
          inst = { type: inst.type, props: props, children: excluded };
          Object.defineProperty(inst, "$$typeof", {
            value: Symbol.for("react.test.json")
          });
          return inst;
        default:
          throw Error("Unexpected node type in toJSON: " + inst.tag);
      }
    }
    function childrenToTree(node) {
      if (!node) return null;
      node = nodeAndSiblingsArray(node);
      return 0 === node.length
        ? null
        : 1 === node.length
          ? toTree(node[0])
          : flatten(node.map(toTree));
    }
    function nodeAndSiblingsArray(nodeWithSibling) {
      for (var array = []; null != nodeWithSibling; )
        array.push(nodeWithSibling),
          (nodeWithSibling = nodeWithSibling.sibling);
      return array;
    }
    function flatten(arr) {
      var result = [];
      for (arr = [{ i: 0, array: arr }]; arr.length; )
        for (var n = arr.pop(); n.i < n.array.length; ) {
          var el = n.array[n.i];
          n.i += 1;
          if (isArrayImpl(el)) {
            arr.push(n);
            arr.push({ i: 0, array: el });
            break;
          }
          result.push(el);
        }
      return result;
    }
    function toTree(node) {
      if (null == node) return null;
      switch (node.tag) {
        case 3:
          return childrenToTree(node.child);
        case 4:
          return childrenToTree(node.child);
        case 1:
          return {
            nodeType: "component",
            type: node.type,
            props: assign({}, node.memoizedProps),
            instance: node.stateNode,
            rendered: childrenToTree(node.child)
          };
        case 0:
        case 15:
          return {
            nodeType: "component",
            type: node.type,
            props: assign({}, node.memoizedProps),
            instance: null,
            rendered: childrenToTree(node.child)
          };
        case 26:
        case 27:
        case 5:
          return {
            nodeType: "host",
            type: node.type,
            props: assign({}, node.memoizedProps),
            instance: null,
            rendered: flatten(nodeAndSiblingsArray(node.child).map(toTree))
          };
        case 6:
          return node.stateNode.text;
        case 7:
        case 10:
        case 9:
        case 8:
        case 12:
        case 11:
        case 14:
        case 17:
        case 21:
          return childrenToTree(node.child);
        default:
          throw Error(
            "toTree() does not yet know how to handle nodes with tag=" +
              node.tag
          );
      }
    }
    function getChildren(parent) {
      var children = [],
        node = parent;
      if (null === node.child) return children;
      node.child.return = node;
      node = node.child;
      a: for (;;) {
        var descend = !1;
        if (validWrapperTypes.has(node.tag)) children.push(wrapFiber(node));
        else if (6 === node.tag) {
          var value = node.memoizedProps;
          try {
            testStringCoercion(value);
            var JSCompiler_inline_result = !1;
          } catch (e$36) {
            JSCompiler_inline_result = !0;
          }
          JSCompiler_inline_result &&
            (error$jscomp$0(
              "The provided `%s` prop is an unsupported type %s. This value must be coerced to a string before using it here.",
              "memoizedProps",
              ("function" === typeof Symbol &&
                Symbol.toStringTag &&
                value[Symbol.toStringTag]) ||
                value.constructor.name ||
                "Object"
            ),
            testStringCoercion(value));
          children.push("" + node.memoizedProps);
        } else descend = !0;
        if (descend && null !== node.child)
          (node.child.return = node), (node = node.child);
        else {
          for (; null === node.sibling; ) {
            if (node.return === parent) break a;
            node = node.return;
          }
          node.sibling.return = node.return;
          node = node.sibling;
        }
      }
      return children;
    }
    function _findAll(root, predicate, options) {
      var deep = options ? options.deep : !0,
        results = [];
      if (predicate(root) && (results.push(root), !deep)) return results;
      root.children.forEach(function (child) {
        "string" !== typeof child &&
          results.push.apply(results, _findAll(child, predicate, options));
      });
      return results;
    }
    function expectOne(all, message) {
      if (1 === all.length) return all[0];
      throw Error(
        (0 === all.length
          ? "No instances found "
          : "Expected 1 but found " + all.length + " instances ") + message
      );
    }
    function wrapFiber(fiber) {
      var wrapper = fiberToWrapper.get(fiber);
      void 0 === wrapper &&
        null !== fiber.alternate &&
        (wrapper = fiberToWrapper.get(fiber.alternate));
      void 0 === wrapper &&
        ((wrapper = new ReactTestInstance(fiber)),
        fiberToWrapper.set(fiber, wrapper));
      return wrapper;
    }
    var React = require("react"),
      Scheduler = require("scheduler/unstable_mock"),
      Scheduler$1 = require("scheduler"),
      ReactSharedInternals =
        React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,
      assign = Object.assign,
      REACT_LEGACY_ELEMENT_TYPE = Symbol.for("react.element"),
      REACT_ELEMENT_TYPE = REACT_LEGACY_ELEMENT_TYPE,
      REACT_PORTAL_TYPE = Symbol.for("react.portal"),
      REACT_FRAGMENT_TYPE = Symbol.for("react.fragment"),
      REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode"),
      REACT_PROFILER_TYPE = Symbol.for("react.profiler"),
      REACT_PROVIDER_TYPE = Symbol.for("react.provider"),
      REACT_CONSUMER_TYPE = Symbol.for("react.consumer"),
      REACT_CONTEXT_TYPE = Symbol.for("react.context"),
      REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref"),
      REACT_SUSPENSE_TYPE = Symbol.for("react.suspense"),
      REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list"),
      REACT_MEMO_TYPE = Symbol.for("react.memo"),
      REACT_LAZY_TYPE = Symbol.for("react.lazy");
    Symbol.for("react.scope");
    Symbol.for("react.debug_trace_mode");
    var REACT_OFFSCREEN_TYPE = Symbol.for("react.offscreen");
    Symbol.for("react.legacy_hidden");
    Symbol.for("react.tracing_marker");
    var REACT_MEMO_CACHE_SENTINEL = Symbol.for("react.memo_cache_sentinel"),
      MAYBE_ITERATOR_SYMBOL = Symbol.iterator,
      REACT_CLIENT_REFERENCE = Symbol.for("react.client.reference"),
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
    var current = null,
      isRendering = !1,
      isArrayImpl = Array.isArray,
      scheduleCallback$3 = Scheduler$1.unstable_scheduleCallback,
      cancelCallback$1 = Scheduler$1.unstable_cancelCallback,
      shouldYield = Scheduler$1.unstable_shouldYield,
      requestPaint = Scheduler$1.unstable_requestPaint,
      now$1 = Scheduler$1.unstable_now,
      ImmediatePriority = Scheduler$1.unstable_ImmediatePriority,
      UserBlockingPriority = Scheduler$1.unstable_UserBlockingPriority,
      NormalPriority$1 = Scheduler$1.unstable_NormalPriority,
      IdlePriority = Scheduler$1.unstable_IdlePriority,
      rendererID = null,
      injectedHook = null,
      injectedProfilingHooks = null,
      hasLoggedError = !1,
      isDevToolsPresent = "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__,
      clz32 = Math.clz32 ? Math.clz32 : clz32Fallback,
      log = Math.log,
      LN2 = Math.LN2,
      nextTransitionLane = 128,
      nextRetryLane = 4194304,
      DiscreteEventPriority = 2,
      ContinuousEventPriority = 8,
      DefaultEventPriority = 32,
      IdleEventPriority = 268435456,
      isSuspenseInstancePending = shim$1,
      isSuspenseInstanceFallback = shim$1,
      getSuspenseInstanceFallbackErrorDetails = shim$1,
      registerSuspenseInstanceRetry = shim$1,
      clearSuspenseBoundary = shim$1,
      clearSuspenseBoundaryFromContainer = shim$1,
      preloadResource = shim,
      suspendResource = shim,
      NO_CONTEXT = {},
      nodeToInstanceMap = new WeakMap();
    Object.freeze(NO_CONTEXT);
    var currentUpdatePriority = 0,
      scheduleTimeout = setTimeout,
      cancelTimeout = clearTimeout,
      appendChildToContainer = appendChild,
      insertInContainerBefore = insertBefore,
      removeChildFromContainer = removeChild,
      HostTransitionContext = {
        $$typeof: REACT_CONTEXT_TYPE,
        Provider: null,
        Consumer: null,
        _currentValue: null,
        _currentValue2: null,
        _threadCount: 0
      },
      bind = Function.prototype.bind,
      valueStack = [];
    var fiberStack = [];
    var index$jscomp$0 = -1;
    var warnedAboutMissingGetChildContext = {};
    var emptyContextObject = {};
    Object.freeze(emptyContextObject);
    var contextStackCursor$1 = createCursor(emptyContextObject),
      didPerformWorkStackCursor = createCursor(!1),
      previousContext = emptyContextObject,
      objectIs = "function" === typeof Object.is ? Object.is : is,
      CapturedStacks = new WeakMap(),
      contextStackCursor = createCursor(null),
      contextFiberStackCursor = createCursor(null),
      rootInstanceStackCursor = createCursor(null),
      hostTransitionProviderCursor = createCursor(null),
      needsEscaping = /["'&<>\n\t]|^\s|\s$/,
      hydrationDiffRootDEV = null,
      hydrationErrors = null,
      concurrentQueues = [],
      concurrentQueuesIndex = 0,
      concurrentlyUpdatedLanes = 0,
      now = Scheduler$1.unstable_now,
      commitStartTime = -0,
      profilerStartTime = -1.1,
      profilerEffectDuration = -0,
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
      UpdateState = 0,
      ReplaceState = 1,
      ForceUpdate = 2,
      CaptureUpdate = 3,
      hasForceUpdate = !1;
    var didWarnUpdateInsideUpdate = !1;
    var currentlyProcessingQueue = null;
    var didReadFromEntangledAsyncAction = !1,
      hasOwnProperty = Object.prototype.hasOwnProperty,
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
        error$jscomp$0(
          "Using UNSAFE_componentWillMount in strict mode is not recommended and may indicate bugs in your code. See https://react.dev/link/unsafe-component-lifecycles for details.\n\n* Move code with side effects to componentDidMount, and set initial state in the constructor.\n\nPlease update the following components: %s",
          sortedNames
        );
      }
      0 < UNSAFE_componentWillReceivePropsUniqueNames.size &&
        ((sortedNames = setToSortedString(
          UNSAFE_componentWillReceivePropsUniqueNames
        )),
        error$jscomp$0(
          "Using UNSAFE_componentWillReceiveProps in strict mode is not recommended and may indicate bugs in your code. See https://react.dev/link/unsafe-component-lifecycles for details.\n\n* Move data fetching code or side effects to componentDidUpdate.\n* If you're updating state whenever props change, refactor your code to use memoization techniques or move it to static getDerivedStateFromProps. Learn more at: https://react.dev/link/derived-state\n\nPlease update the following components: %s",
          sortedNames
        ));
      0 < UNSAFE_componentWillUpdateUniqueNames.size &&
        ((sortedNames = setToSortedString(
          UNSAFE_componentWillUpdateUniqueNames
        )),
        error$jscomp$0(
          "Using UNSAFE_componentWillUpdate in strict mode is not recommended and may indicate bugs in your code. See https://react.dev/link/unsafe-component-lifecycles for details.\n\n* Move data fetching code or side effects to componentDidUpdate.\n\nPlease update the following components: %s",
          sortedNames
        ));
      0 < componentWillMountUniqueNames.size &&
        ((sortedNames = setToSortedString(componentWillMountUniqueNames)),
        warn(
          "componentWillMount has been renamed, and is not recommended for use. See https://react.dev/link/unsafe-component-lifecycles for details.\n\n* Move code with side effects to componentDidMount, and set initial state in the constructor.\n* Rename componentWillMount to UNSAFE_componentWillMount to suppress this warning in non-strict mode. In React 18.x, only the UNSAFE_ name will work. To rename all deprecated lifecycles to their new names, you can run `npx react-codemod rename-unsafe-lifecycles` in your project source folder.\n\nPlease update the following components: %s",
          sortedNames
        ));
      0 < componentWillReceivePropsUniqueNames.size &&
        ((sortedNames = setToSortedString(
          componentWillReceivePropsUniqueNames
        )),
        warn(
          "componentWillReceiveProps has been renamed, and is not recommended for use. See https://react.dev/link/unsafe-component-lifecycles for details.\n\n* Move data fetching code or side effects to componentDidUpdate.\n* If you're updating state whenever props change, refactor your code to use memoization techniques or move it to static getDerivedStateFromProps. Learn more at: https://react.dev/link/derived-state\n* Rename componentWillReceiveProps to UNSAFE_componentWillReceiveProps to suppress this warning in non-strict mode. In React 18.x, only the UNSAFE_ name will work. To rename all deprecated lifecycles to their new names, you can run `npx react-codemod rename-unsafe-lifecycles` in your project source folder.\n\nPlease update the following components: %s",
          sortedNames
        ));
      0 < componentWillUpdateUniqueNames.size &&
        ((sortedNames = setToSortedString(componentWillUpdateUniqueNames)),
        warn(
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
        ? error$jscomp$0(
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
            error$jscomp$0(
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
    var SuspenseException = Error(
        "Suspense Exception: This is not a real error! It's an implementation detail of `use` to interrupt the current render. You must either rethrow it immediately, or move the `use` call outside of the `try/catch` block. Capturing without rethrowing will lead to unexpected behavior.\n\nTo handle async errors, wrap your component in an error boundary, or call the promise's `.catch` method and pass the result to `use`"
      ),
      SuspenseyCommitException = Error(
        "Suspense Exception: This is not a real error, and should not leak into userspace. If you're seeing this, it's likely a bug in React."
      ),
      noopSuspenseyCommitThenable = {
        then: function () {
          error$jscomp$0(
            'Internal React error: A listener was unexpectedly attached to a "noop" thenable. This is a bug in React. Please file an issue.'
          );
        }
      },
      suspendedThenable = null,
      needsToResetSuspendedThenableDEV = !1,
      callComponent = {
        "react-stack-bottom-frame": function (Component, props, secondArg) {
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
        callComponent["react-stack-bottom-frame"].bind(callComponent),
      callRender = {
        "react-stack-bottom-frame": function (instance) {
          var wasRendering = isRendering;
          isRendering = !0;
          try {
            return instance.render();
          } finally {
            isRendering = wasRendering;
          }
        }
      },
      callRenderInDEV = callRender["react-stack-bottom-frame"].bind(callRender),
      callComponentDidMount = {
        "react-stack-bottom-frame": function (finishedWork, instance) {
          try {
            instance.componentDidMount();
          } catch (error$2) {
            captureCommitPhaseError(finishedWork, finishedWork.return, error$2);
          }
        }
      },
      callComponentDidMountInDEV = callComponentDidMount[
        "react-stack-bottom-frame"
      ].bind(callComponentDidMount),
      callComponentDidUpdate = {
        "react-stack-bottom-frame": function (
          finishedWork,
          instance,
          prevProps,
          prevState,
          snapshot
        ) {
          try {
            instance.componentDidUpdate(prevProps, prevState, snapshot);
          } catch (error$3) {
            captureCommitPhaseError(finishedWork, finishedWork.return, error$3);
          }
        }
      },
      callComponentDidUpdateInDEV = callComponentDidUpdate[
        "react-stack-bottom-frame"
      ].bind(callComponentDidUpdate),
      callComponentDidCatch = {
        "react-stack-bottom-frame": function (instance, errorInfo) {
          var stack = errorInfo.stack;
          instance.componentDidCatch(errorInfo.value, {
            componentStack: null !== stack ? stack : ""
          });
        }
      },
      callComponentDidCatchInDEV = callComponentDidCatch[
        "react-stack-bottom-frame"
      ].bind(callComponentDidCatch),
      callComponentWillUnmount = {
        "react-stack-bottom-frame": function (
          current,
          nearestMountedAncestor,
          instance
        ) {
          try {
            instance.componentWillUnmount();
          } catch (error$4) {
            captureCommitPhaseError(current, nearestMountedAncestor, error$4);
          }
        }
      },
      callComponentWillUnmountInDEV = callComponentWillUnmount[
        "react-stack-bottom-frame"
      ].bind(callComponentWillUnmount),
      callCreate = {
        "react-stack-bottom-frame": function (effect) {
          var create = effect.create;
          effect = effect.inst;
          create = create();
          return (effect.destroy = create);
        }
      },
      callCreateInDEV = callCreate["react-stack-bottom-frame"].bind(callCreate),
      callDestroy = {
        "react-stack-bottom-frame": function (
          current,
          nearestMountedAncestor,
          destroy
        ) {
          try {
            destroy();
          } catch (error$5) {
            captureCommitPhaseError(current, nearestMountedAncestor, error$5);
          }
        }
      },
      callDestroyInDEV =
        callDestroy["react-stack-bottom-frame"].bind(callDestroy),
      callLazyInit = {
        "react-stack-bottom-frame": function (lazy) {
          var init = lazy._init;
          return init(lazy._payload);
        }
      },
      callLazyInitInDEV =
        callLazyInit["react-stack-bottom-frame"].bind(callLazyInit),
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
            error$jscomp$0(
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
      currentlyRenderingFiber$1 = null,
      currentHook = null,
      workInProgressHook = null,
      didScheduleRenderPhaseUpdate = !1,
      didScheduleRenderPhaseUpdateDuringThisPass = !1,
      shouldDoubleInvokeUserFnsInHooksDEV = !1,
      thenableIndexCounter = 0,
      thenableState = null,
      globalClientIdCounter = 0,
      RE_RENDER_LIMIT = 25,
      currentHookNameInDev = null,
      hookTypesDev = null,
      hookTypesUpdateIndexDev = -1,
      ignorePreviousDependencies = !1;
    var createFunctionComponentUpdateQueue = function () {
      return { lastEffect: null, events: null, stores: null, memoCache: null };
    };
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
      useId: throwInvalidHookError
    };
    ContextOnlyDispatcher.useCacheRefresh = throwInvalidHookError;
    ContextOnlyDispatcher.useMemoCache = throwInvalidHookError;
    ContextOnlyDispatcher.useHostTransitionStatus = throwInvalidHookError;
    ContextOnlyDispatcher.useFormState = throwInvalidHookError;
    ContextOnlyDispatcher.useActionState = throwInvalidHookError;
    ContextOnlyDispatcher.useOptimistic = throwInvalidHookError;
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
      useSyncExternalStore: function (subscribe, getSnapshot) {
        currentHookNameInDev = "useSyncExternalStore";
        mountHookTypesDev();
        return mountSyncExternalStore(subscribe, getSnapshot);
      },
      useId: function () {
        currentHookNameInDev = "useId";
        mountHookTypesDev();
        return mountId();
      },
      useCacheRefresh: function () {
        currentHookNameInDev = "useCacheRefresh";
        mountHookTypesDev();
        return mountRefresh();
      }
    };
    HooksDispatcherOnMountInDEV.useMemoCache = useMemoCache;
    HooksDispatcherOnMountInDEV.useHostTransitionStatus =
      useHostTransitionStatus;
    HooksDispatcherOnMountInDEV.useFormState = function (action, initialState) {
      currentHookNameInDev = "useFormState";
      mountHookTypesDev();
      warnOnUseFormStateInDev();
      return mountActionState(action, initialState);
    };
    HooksDispatcherOnMountInDEV.useActionState = function (
      action,
      initialState
    ) {
      currentHookNameInDev = "useActionState";
      mountHookTypesDev();
      return mountActionState(action, initialState);
    };
    HooksDispatcherOnMountInDEV.useOptimistic = function (passthrough) {
      currentHookNameInDev = "useOptimistic";
      mountHookTypesDev();
      return mountOptimistic(passthrough);
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
      useSyncExternalStore: function (subscribe, getSnapshot) {
        currentHookNameInDev = "useSyncExternalStore";
        updateHookTypesDev();
        return mountSyncExternalStore(subscribe, getSnapshot);
      },
      useId: function () {
        currentHookNameInDev = "useId";
        updateHookTypesDev();
        return mountId();
      },
      useCacheRefresh: function () {
        currentHookNameInDev = "useCacheRefresh";
        updateHookTypesDev();
        return mountRefresh();
      }
    };
    HooksDispatcherOnMountWithHookTypesInDEV.useMemoCache = useMemoCache;
    HooksDispatcherOnMountWithHookTypesInDEV.useHostTransitionStatus =
      useHostTransitionStatus;
    HooksDispatcherOnMountWithHookTypesInDEV.useFormState = function (
      action,
      initialState
    ) {
      currentHookNameInDev = "useFormState";
      updateHookTypesDev();
      warnOnUseFormStateInDev();
      return mountActionState(action, initialState);
    };
    HooksDispatcherOnMountWithHookTypesInDEV.useActionState = function (
      action,
      initialState
    ) {
      currentHookNameInDev = "useActionState";
      updateHookTypesDev();
      return mountActionState(action, initialState);
    };
    HooksDispatcherOnMountWithHookTypesInDEV.useOptimistic = function (
      passthrough
    ) {
      currentHookNameInDev = "useOptimistic";
      updateHookTypesDev();
      return mountOptimistic(passthrough);
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
      useSyncExternalStore: function (subscribe, getSnapshot) {
        currentHookNameInDev = "useSyncExternalStore";
        updateHookTypesDev();
        return updateSyncExternalStore(subscribe, getSnapshot);
      },
      useId: function () {
        currentHookNameInDev = "useId";
        updateHookTypesDev();
        return updateWorkInProgressHook().memoizedState;
      },
      useCacheRefresh: function () {
        currentHookNameInDev = "useCacheRefresh";
        updateHookTypesDev();
        return updateWorkInProgressHook().memoizedState;
      }
    };
    HooksDispatcherOnUpdateInDEV.useMemoCache = useMemoCache;
    HooksDispatcherOnUpdateInDEV.useHostTransitionStatus =
      useHostTransitionStatus;
    HooksDispatcherOnUpdateInDEV.useFormState = function (action) {
      currentHookNameInDev = "useFormState";
      updateHookTypesDev();
      warnOnUseFormStateInDev();
      return updateActionState(action);
    };
    HooksDispatcherOnUpdateInDEV.useActionState = function (action) {
      currentHookNameInDev = "useActionState";
      updateHookTypesDev();
      return updateActionState(action);
    };
    HooksDispatcherOnUpdateInDEV.useOptimistic = function (
      passthrough,
      reducer
    ) {
      currentHookNameInDev = "useOptimistic";
      updateHookTypesDev();
      return updateOptimistic(passthrough, reducer);
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
      useSyncExternalStore: function (subscribe, getSnapshot) {
        currentHookNameInDev = "useSyncExternalStore";
        updateHookTypesDev();
        return updateSyncExternalStore(subscribe, getSnapshot);
      },
      useId: function () {
        currentHookNameInDev = "useId";
        updateHookTypesDev();
        return updateWorkInProgressHook().memoizedState;
      },
      useCacheRefresh: function () {
        currentHookNameInDev = "useCacheRefresh";
        updateHookTypesDev();
        return updateWorkInProgressHook().memoizedState;
      }
    };
    HooksDispatcherOnRerenderInDEV.useMemoCache = useMemoCache;
    HooksDispatcherOnRerenderInDEV.useHostTransitionStatus =
      useHostTransitionStatus;
    HooksDispatcherOnRerenderInDEV.useFormState = function (action) {
      currentHookNameInDev = "useFormState";
      updateHookTypesDev();
      warnOnUseFormStateInDev();
      return rerenderActionState(action);
    };
    HooksDispatcherOnRerenderInDEV.useActionState = function (action) {
      currentHookNameInDev = "useActionState";
      updateHookTypesDev();
      return rerenderActionState(action);
    };
    HooksDispatcherOnRerenderInDEV.useOptimistic = function (
      passthrough,
      reducer
    ) {
      currentHookNameInDev = "useOptimistic";
      updateHookTypesDev();
      return rerenderOptimistic(passthrough, reducer);
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
      useSyncExternalStore: function (subscribe, getSnapshot) {
        currentHookNameInDev = "useSyncExternalStore";
        warnInvalidHookAccess();
        mountHookTypesDev();
        return mountSyncExternalStore(subscribe, getSnapshot);
      },
      useId: function () {
        currentHookNameInDev = "useId";
        warnInvalidHookAccess();
        mountHookTypesDev();
        return mountId();
      },
      useCacheRefresh: function () {
        currentHookNameInDev = "useCacheRefresh";
        mountHookTypesDev();
        return mountRefresh();
      },
      useMemoCache: function (size) {
        warnInvalidHookAccess();
        return useMemoCache(size);
      }
    };
    InvalidNestedHooksDispatcherOnMountInDEV.useHostTransitionStatus =
      useHostTransitionStatus;
    InvalidNestedHooksDispatcherOnMountInDEV.useFormState = function (
      action,
      initialState
    ) {
      currentHookNameInDev = "useFormState";
      warnInvalidHookAccess();
      mountHookTypesDev();
      return mountActionState(action, initialState);
    };
    InvalidNestedHooksDispatcherOnMountInDEV.useActionState = function (
      action,
      initialState
    ) {
      currentHookNameInDev = "useActionState";
      warnInvalidHookAccess();
      mountHookTypesDev();
      return mountActionState(action, initialState);
    };
    InvalidNestedHooksDispatcherOnMountInDEV.useOptimistic = function (
      passthrough
    ) {
      currentHookNameInDev = "useOptimistic";
      warnInvalidHookAccess();
      mountHookTypesDev();
      return mountOptimistic(passthrough);
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
      useSyncExternalStore: function (subscribe, getSnapshot) {
        currentHookNameInDev = "useSyncExternalStore";
        warnInvalidHookAccess();
        updateHookTypesDev();
        return updateSyncExternalStore(subscribe, getSnapshot);
      },
      useId: function () {
        currentHookNameInDev = "useId";
        warnInvalidHookAccess();
        updateHookTypesDev();
        return updateWorkInProgressHook().memoizedState;
      },
      useCacheRefresh: function () {
        currentHookNameInDev = "useCacheRefresh";
        updateHookTypesDev();
        return updateWorkInProgressHook().memoizedState;
      },
      useMemoCache: function (size) {
        warnInvalidHookAccess();
        return useMemoCache(size);
      }
    };
    InvalidNestedHooksDispatcherOnUpdateInDEV.useHostTransitionStatus =
      useHostTransitionStatus;
    InvalidNestedHooksDispatcherOnUpdateInDEV.useFormState = function (action) {
      currentHookNameInDev = "useFormState";
      warnInvalidHookAccess();
      updateHookTypesDev();
      return updateActionState(action);
    };
    InvalidNestedHooksDispatcherOnUpdateInDEV.useActionState = function (
      action
    ) {
      currentHookNameInDev = "useActionState";
      warnInvalidHookAccess();
      updateHookTypesDev();
      return updateActionState(action);
    };
    InvalidNestedHooksDispatcherOnUpdateInDEV.useOptimistic = function (
      passthrough,
      reducer
    ) {
      currentHookNameInDev = "useOptimistic";
      warnInvalidHookAccess();
      updateHookTypesDev();
      return updateOptimistic(passthrough, reducer);
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
      useSyncExternalStore: function (subscribe, getSnapshot) {
        currentHookNameInDev = "useSyncExternalStore";
        warnInvalidHookAccess();
        updateHookTypesDev();
        return updateSyncExternalStore(subscribe, getSnapshot);
      },
      useId: function () {
        currentHookNameInDev = "useId";
        warnInvalidHookAccess();
        updateHookTypesDev();
        return updateWorkInProgressHook().memoizedState;
      },
      useCacheRefresh: function () {
        currentHookNameInDev = "useCacheRefresh";
        updateHookTypesDev();
        return updateWorkInProgressHook().memoizedState;
      },
      useMemoCache: function (size) {
        warnInvalidHookAccess();
        return useMemoCache(size);
      }
    };
    InvalidNestedHooksDispatcherOnRerenderInDEV.useHostTransitionStatus =
      useHostTransitionStatus;
    InvalidNestedHooksDispatcherOnRerenderInDEV.useFormState = function (
      action
    ) {
      currentHookNameInDev = "useFormState";
      warnInvalidHookAccess();
      updateHookTypesDev();
      return rerenderActionState(action);
    };
    InvalidNestedHooksDispatcherOnRerenderInDEV.useActionState = function (
      action
    ) {
      currentHookNameInDev = "useActionState";
      warnInvalidHookAccess();
      updateHookTypesDev();
      return rerenderActionState(action);
    };
    InvalidNestedHooksDispatcherOnRerenderInDEV.useOptimistic = function (
      passthrough,
      reducer
    ) {
      currentHookNameInDev = "useOptimistic";
      warnInvalidHookAccess();
      updateHookTypesDev();
      return rerenderOptimistic(passthrough, reducer);
    };
    var fakeInternalInstance = {};
    var didWarnAboutStateAssignmentForComponent = new Set();
    var didWarnAboutUninitializedState = new Set();
    var didWarnAboutGetSnapshotBeforeUpdateWithoutDidUpdate = new Set();
    var didWarnAboutLegacyLifecyclesAndDerivedState = new Set();
    var didWarnAboutDirectlyAssigningPropsToState = new Set();
    var didWarnAboutUndefinedDerivedState = new Set();
    var didWarnAboutContextTypeAndContextTypes = new Set();
    var didWarnAboutContextTypes$1 = new Set();
    var didWarnAboutChildContextTypes = new Set();
    var didWarnAboutInvalidateContextType = new Set();
    var didWarnOnInvalidCallback = new Set();
    Object.freeze(fakeInternalInstance);
    var classComponentUpdater = {
        isMounted: function (component) {
          var owner = current;
          if (null !== owner && isRendering && 1 === owner.tag) {
            var instance = owner.stateNode;
            instance._warnedAboutRefsInRender ||
              error$jscomp$0(
                "%s is accessing isMounted inside its render() function. render() should be a pure function of props and state. It should never access something that requires stale data from the previous render, such as refs. Move this logic to componentDidMount and componentDidUpdate instead.",
                getComponentNameFromFiber(owner) || "A component"
              );
            instance._warnedAboutRefsInRender = !0;
          }
          return (component = component._reactInternals)
            ? getNearestMountedFiber(component) === component
            : !1;
        },
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
            (scheduleUpdateOnFiber(payload, inst, lane),
            entangleTransitions(payload, inst, lane));
          markStateUpdateScheduled(inst, lane);
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
            (scheduleUpdateOnFiber(payload, inst, lane),
            entangleTransitions(payload, inst, lane));
          markStateUpdateScheduled(inst, lane);
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
            (scheduleUpdateOnFiber(callback, inst, lane),
            entangleTransitions(callback, inst, lane));
          null !== injectedProfilingHooks &&
            "function" ===
              typeof injectedProfilingHooks.markForceUpdateScheduled &&
            injectedProfilingHooks.markForceUpdateScheduled(inst, lane);
        }
      },
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
      componentName = null,
      errorBoundaryName = null,
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
    var SUSPENDED_MARKER = {
        dehydrated: null,
        treeContext: null,
        retryLane: 0
      },
      hasWarnedAboutUsingNoValuePropOnContextProvider = !1,
      valueCursor = createCursor(null);
    var renderer2CursorDEV = createCursor(null);
    var rendererSigil = {};
    var currentlyRenderingFiber = null,
      lastContextDependency = null,
      lastFullyObservedContext = null,
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
      scheduleCallback$1 = Scheduler$1.unstable_scheduleCallback,
      NormalPriority = Scheduler$1.unstable_NormalPriority,
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
      prevOnStartTransitionFinish = ReactSharedInternals.S;
    ReactSharedInternals.S = function (transition, returnValue) {
      "object" === typeof returnValue &&
        null !== returnValue &&
        "function" === typeof returnValue.then &&
        entangleAsyncAction(transition, returnValue);
      null !== prevOnStartTransitionFinish &&
        prevOnStartTransitionFinish(transition, returnValue);
    };
    var resumedCache = createCursor(null),
      didWarnAboutUndefinedSnapshotBeforeUpdate = null;
    didWarnAboutUndefinedSnapshotBeforeUpdate = new Set();
    var offscreenSubtreeIsHidden = !1,
      offscreenSubtreeWasHidden = !1,
      PossiblyWeakSet = "function" === typeof WeakSet ? WeakSet : Set,
      nextEffect = null,
      shouldFireAfterActiveInstanceBlur = !1,
      hostParent = null,
      hostParentIsContainer = !1,
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
        getOwner: function () {
          return current;
        }
      };
    if ("function" === typeof Symbol && Symbol.for) {
      var symbolFor = Symbol.for;
      symbolFor("selector.component");
      symbolFor("selector.has_pseudo_class");
      symbolFor("selector.role");
      symbolFor("selector.test_id");
      symbolFor("selector.text");
    }
    var PossiblyWeakMap = "function" === typeof WeakMap ? WeakMap : Map,
      NoContext = 0,
      RenderContext = 2,
      CommitContext = 4,
      RootInProgress = 0,
      RootFatalErrored = 1,
      RootErrored = 2,
      RootSuspended = 3,
      RootSuspendedWithDelay = 4,
      RootCompleted = 5,
      RootDidNotComplete = 6,
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
      workInProgressSuspendedReason = NotSuspended,
      workInProgressThrownValue = null,
      workInProgressRootDidSkipSuspendedSiblings = !1,
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
      globalMostRecentFallbackTime = 0,
      FALLBACK_THROTTLE_MS = 300,
      workInProgressRootRenderTargetTime = Infinity,
      RENDER_TIMEOUT_MS = 500,
      workInProgressTransitions = null,
      legacyErrorBoundariesThatAlreadyFailed = null,
      rootDoesHavePassiveEffects = !1,
      rootWithPendingPassiveEffects = null,
      pendingPassiveEffectsLanes = 0,
      pendingPassiveEffectsRemainingLanes = 0,
      pendingPassiveTransitions = null,
      NESTED_UPDATE_LIMIT = 50,
      nestedUpdateCount = 0,
      rootWithNestedUpdates = null,
      isFlushingPassiveEffects = !1,
      didScheduleUpdateDuringPassiveEffects = !1,
      NESTED_PASSIVE_UPDATE_LIMIT = 50,
      nestedPassiveUpdateCount = 0,
      rootWithPassiveNestedUpdates = null,
      isRunningInsertionEffect = !1,
      IMMEDIATE_COMMIT = 0,
      THROTTLED_COMMIT = 2,
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
    var didWarnAboutNestedUpdates = !1;
    var overrideHookState = null,
      overrideHookStateDeletePath = null,
      overrideHookStateRenamePath = null,
      overrideProps = null,
      overridePropsDeletePath = null,
      overridePropsRenamePath = null,
      scheduleUpdate = null,
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
    setErrorHandler = function (newShouldErrorImpl) {
      shouldErrorImpl = newShouldErrorImpl;
    };
    setSuspenseHandler = function (newShouldSuspendImpl) {
      shouldSuspendImpl = newShouldSuspendImpl;
    };
    var act = React.act,
      validWrapperTypes = new Set([0, 1, 5, 11, 14, 15, 3]),
      ReactTestInstance = (function () {
        function ReactTestInstance(fiber) {
          this._fiber = void 0;
          if (!validWrapperTypes.has(fiber.tag))
            throw Error(
              "Unexpected object passed to ReactTestInstance constructor (tag: " +
                fiber.tag +
                "). This is probably a bug in React."
            );
          this._fiber = fiber;
        }
        var _proto = ReactTestInstance.prototype;
        _proto._currentFiber = function () {
          var fiber = findCurrentFiberUsingSlowPath(this._fiber);
          if (null === fiber)
            throw Error(
              "Can't read from currently-mounting component. This error is likely caused by a bug in React. Please file an issue."
            );
          return fiber;
        };
        _proto.find = function (predicate) {
          return expectOne(
            this.findAll(predicate, { deep: !1 }),
            "matching custom predicate: " + predicate.toString()
          );
        };
        _proto.findByType = function (type) {
          return expectOne(
            this.findAllByType(type, { deep: !1 }),
            'with node type: "' +
              (getComponentNameFromType(type) || "Unknown") +
              '"'
          );
        };
        _proto.findByProps = function (props) {
          return expectOne(
            this.findAllByProps(props, { deep: !1 }),
            "with props: " + JSON.stringify(props)
          );
        };
        _proto.findAll = function (predicate) {
          return _findAll(
            this,
            predicate,
            1 < arguments.length && void 0 !== arguments[1]
              ? arguments[1]
              : null
          );
        };
        _proto.findAllByType = function (type) {
          return _findAll(
            this,
            function (node) {
              return node.type === type;
            },
            1 < arguments.length && void 0 !== arguments[1]
              ? arguments[1]
              : null
          );
        };
        _proto.findAllByProps = function (props) {
          return _findAll(
            this,
            function (node) {
              var JSCompiler_temp;
              if ((JSCompiler_temp = node.props))
                a: {
                  for (var key in props)
                    if (node.props[key] !== props[key]) {
                      JSCompiler_temp = !1;
                      break a;
                    }
                  JSCompiler_temp = !0;
                }
              return JSCompiler_temp;
            },
            1 < arguments.length && void 0 !== arguments[1]
              ? arguments[1]
              : null
          );
        };
        _createClass(ReactTestInstance, [
          {
            key: "instance",
            get: function () {
              var tag = this._fiber.tag;
              return 5 === tag || 26 === tag || 27 === tag
                ? getPublicInstance(this._fiber.stateNode)
                : this._fiber.stateNode;
            }
          },
          {
            key: "type",
            get: function () {
              return this._fiber.type;
            }
          },
          {
            key: "props",
            get: function () {
              return this._currentFiber().memoizedProps;
            }
          },
          {
            key: "parent",
            get: function () {
              for (var parent = this._fiber.return; null !== parent; ) {
                if (validWrapperTypes.has(parent.tag)) {
                  if (3 === parent.tag && 2 > getChildren(parent).length) break;
                  return wrapFiber(parent);
                }
                parent = parent.return;
              }
              return null;
            }
          },
          {
            key: "children",
            get: function () {
              return getChildren(this._currentFiber());
            }
          }
        ]);
        return ReactTestInstance;
      })(),
      fiberToWrapper = new WeakMap();
    (function () {
      var internals = {
        bundleType: 1,
        version: "19.0.0-native-fb-13411e45-20241014",
        rendererPackageName: "react-test-renderer",
        currentDispatcherRef: ReactSharedInternals,
        findFiberByHostInstance: getInstanceFromNode,
        reconcilerVersion: "19.0.0-native-fb-13411e45-20241014"
      };
      internals.overrideHookState = overrideHookState;
      internals.overrideHookStateDeletePath = overrideHookStateDeletePath;
      internals.overrideHookStateRenamePath = overrideHookStateRenamePath;
      internals.overrideProps = overrideProps;
      internals.overridePropsDeletePath = overridePropsDeletePath;
      internals.overridePropsRenamePath = overridePropsRenamePath;
      internals.scheduleUpdate = scheduleUpdate;
      internals.setErrorHandler = setErrorHandler;
      internals.setSuspenseHandler = setSuspenseHandler;
      internals.scheduleRefresh = scheduleRefresh;
      internals.scheduleRoot = scheduleRoot;
      internals.setRefreshHandler = setRefreshHandler;
      internals.getCurrentFiber = getCurrentFiberForDevTools;
      internals.getLaneLabelMap = getLaneLabelMap;
      internals.injectProfilingHooks = injectProfilingHooks;
      return injectInternals(internals);
    })();
    exports._Scheduler = Scheduler;
    exports.act = act;
    exports.create = function (element, options) {
      var createNodeMock = JSCompiler_object_inline_createNodeMock_1092,
        isConcurrent = !1,
        isStrictMode = !1;
      "object" === typeof options &&
        null !== options &&
        ("function" === typeof options.createNodeMock &&
          (createNodeMock = options.createNodeMock),
        (isConcurrent = options.unstable_isConcurrent),
        !0 === options.unstable_strictMode && (isStrictMode = !0));
      var container = {
          children: [],
          createNodeMock: createNodeMock,
          tag: "CONTAINER"
        },
        root = createContainer(
          container,
          isConcurrent ? 1 : 0,
          null,
          isStrictMode,
          !1,
          "",
          defaultOnUncaughtError,
          defaultOnCaughtError,
          defaultOnRecoverableError,
          null
        );
      if (null == root) throw Error("something went wrong");
      updateContainer(element, root, null, null);
      element = {
        _Scheduler: Scheduler,
        root: void 0,
        toJSON: function () {
          if (
            null == root ||
            null == root.current ||
            null == container ||
            0 === container.children.length
          )
            return null;
          if (1 === container.children.length)
            return toJSON(container.children[0]);
          if (
            2 === container.children.length &&
            !0 === container.children[0].isHidden &&
            !1 === container.children[1].isHidden
          )
            return toJSON(container.children[1]);
          var renderedChildren = null;
          if (container.children && container.children.length)
            for (var i = 0; i < container.children.length; i++) {
              var renderedChild = toJSON(container.children[i]);
              null !== renderedChild &&
                (null === renderedChildren
                  ? (renderedChildren = [renderedChild])
                  : renderedChildren.push(renderedChild));
            }
          return renderedChildren;
        },
        toTree: function () {
          return null == root || null == root.current
            ? null
            : toTree(root.current);
        },
        update: function (newElement) {
          null != root &&
            null != root.current &&
            updateContainer(newElement, root, null, null);
        },
        unmount: function () {
          null != root &&
            null != root.current &&
            (updateContainer(null, root, null, null),
            (root = container = null));
        },
        getInstance: function () {
          if (null == root || null == root.current) return null;
          a: {
            var JSCompiler_inline_result = root.current;
            if (JSCompiler_inline_result.child)
              switch (JSCompiler_inline_result.child.tag) {
                case 27:
                case 5:
                  JSCompiler_inline_result = getPublicInstance(
                    JSCompiler_inline_result.child.stateNode
                  );
                  break a;
                default:
                  JSCompiler_inline_result =
                    JSCompiler_inline_result.child.stateNode;
              }
            else JSCompiler_inline_result = null;
          }
          return JSCompiler_inline_result;
        },
        unstable_flushSync: flushSyncFromReconciler
      };
      Object.defineProperty(element, "root", {
        configurable: !0,
        enumerable: !0,
        get: function () {
          if (null === root)
            throw Error("Can't access .root on unmounted test renderer");
          var children = getChildren(root.current);
          if (0 === children.length)
            throw Error("Can't access .root on unmounted test renderer");
          return 1 === children.length ? children[0] : wrapFiber(root.current);
        }
      });
      return element;
    };
    exports.unstable_batchedUpdates = function (fn, a) {
      var prevExecutionContext = executionContext;
      executionContext |= 1;
      try {
        return fn(a);
      } finally {
        (executionContext = prevExecutionContext),
          executionContext !== NoContext ||
            ReactSharedInternals.isBatchingLegacy ||
            ((workInProgressRootRenderTargetTime = now$1() + RENDER_TIMEOUT_MS),
            flushSyncWorkAcrossRoots_impl(0, !0));
      }
    };
    exports.version = "19.0.0-native-fb-13411e45-20241014";
  })();
