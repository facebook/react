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
  (function () {
    function error(format) {
      for (
        var _len2 = arguments.length,
          args = Array(1 < _len2 ? _len2 - 1 : 0),
          _key2 = 1;
        _key2 < _len2;
        _key2++
      )
        args[_key2 - 1] = arguments[_key2];
      _len2 = format;
      _key2 =
        require("react").__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
      null != _key2 &&
        _key2.getCurrentStack &&
        ((_key2 = _key2.getCurrentStack()),
        "" !== _key2 && ((_len2 += "%s"), args.push(_key2)));
      args.unshift(_len2);
      args.unshift(!1);
      warningWWW.apply(null, args);
    }
    function getComponentNameFromType(type) {
      if (null == type) return null;
      if ("function" === typeof type)
        return type.$$typeof === REACT_CLIENT_REFERENCE$2
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
        case REACT_TRACING_MARKER_TYPE:
          if (enableTransitionTracing) return "TracingMarker";
      }
      if ("object" === typeof type)
        switch (
          ("number" === typeof type.tag &&
            error(
              "Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."
            ),
          type.$$typeof)
        ) {
          case REACT_PROVIDER_TYPE:
            if (enableRenderableContext) break;
            else return (type._context.displayName || "Context") + ".Provider";
          case REACT_CONTEXT_TYPE:
            return enableRenderableContext
              ? (type.displayName || "Context") + ".Provider"
              : (type.displayName || "Context") + ".Consumer";
          case REACT_CONSUMER_TYPE:
            if (enableRenderableContext)
              return (type._context.displayName || "Context") + ".Consumer";
            break;
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
    function typeName(value) {
      return (
        ("function" === typeof Symbol &&
          Symbol.toStringTag &&
          value[Symbol.toStringTag]) ||
        value.constructor.name ||
        "Object"
      );
    }
    function willCoercionThrow(value) {
      try {
        return testStringCoercion(value), !1;
      } catch (e) {
        return !0;
      }
    }
    function testStringCoercion(value) {
      return "" + value;
    }
    function checkKeyStringCoercion(value) {
      if (willCoercionThrow(value))
        return (
          error(
            "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.",
            typeName(value)
          ),
          testStringCoercion(value)
        );
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
        error(
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
    function describeUnknownElementTypeFrameInDEV(type) {
      if (null == type) return "";
      if ("function" === typeof type) {
        var prototype = type.prototype;
        return describeNativeComponentFrame(
          type,
          !(!prototype || !prototype.isReactComponent)
        );
      }
      if ("string" === typeof type) return describeBuiltInComponentFrame(type);
      switch (type) {
        case REACT_SUSPENSE_TYPE:
          return describeBuiltInComponentFrame("Suspense");
        case REACT_SUSPENSE_LIST_TYPE:
          return describeBuiltInComponentFrame("SuspenseList");
      }
      if ("object" === typeof type)
        switch (type.$$typeof) {
          case REACT_FORWARD_REF_TYPE:
            return (type = describeNativeComponentFrame(type.render, !1)), type;
          case REACT_MEMO_TYPE:
            return describeUnknownElementTypeFrameInDEV(type.type);
          case REACT_LAZY_TYPE:
            prototype = type._payload;
            type = type._init;
            try {
              return describeUnknownElementTypeFrameInDEV(type(prototype));
            } catch (x) {}
        }
      return "";
    }
    function getComponentNameFromFiber(fiber) {
      var type = fiber.type;
      switch (fiber.tag) {
        case 24:
          return "Cache";
        case 9:
          return enableRenderableContext
            ? (type._context.displayName || "Context") + ".Consumer"
            : (type.displayName || "Context") + ".Consumer";
        case 10:
          return enableRenderableContext
            ? (type.displayName || "Context") + ".Provider"
            : (type._context.displayName || "Context") + ".Provider";
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
    function getOwner() {
      var dispatcher = ReactSharedInternals.A;
      return null === dispatcher ? null : dispatcher.getOwner();
    }
    function hasValidRef(config) {
      if (hasOwnProperty.call(config, "ref")) {
        var getter = Object.getOwnPropertyDescriptor(config, "ref").get;
        if (getter && getter.isReactWarning) return !1;
      }
      return void 0 !== config.ref;
    }
    function hasValidKey(config) {
      if (hasOwnProperty.call(config, "key")) {
        var getter = Object.getOwnPropertyDescriptor(config, "key").get;
        if (getter && getter.isReactWarning) return !1;
      }
      return void 0 !== config.key;
    }
    function warnIfStringRefCannotBeAutoConverted(config, self) {
      var owner;
      !disableStringRefs &&
        "string" === typeof config.ref &&
        (owner = getOwner()) &&
        self &&
        owner.stateNode !== self &&
        ((self = getComponentNameFromType(owner.type)),
        didWarnAboutStringRefs[self] ||
          (error(
            'Component "%s" contains the string ref "%s". Support for string refs will be removed in a future major release. This case cannot be automatically converted to an arrow function. We ask you to manually fix this case by using useRef() or createRef() instead. Learn more about using refs safely here: https://react.dev/link/strict-mode-string-ref',
            getComponentNameFromType(owner.type),
            config.ref
          ),
          (didWarnAboutStringRefs[self] = !0)));
    }
    function defineKeyPropWarningGetter(props, displayName) {
      function warnAboutAccessingKey() {
        specialPropKeyWarningShown ||
          ((specialPropKeyWarningShown = !0),
          error(
            "%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)",
            displayName
          ));
      }
      warnAboutAccessingKey.isReactWarning = !0;
      Object.defineProperty(props, "key", {
        get: warnAboutAccessingKey,
        configurable: !0
      });
    }
    function elementRefGetterWithDeprecationWarning() {
      var componentName = getComponentNameFromType(this.type);
      didWarnAboutElementRef[componentName] ||
        ((didWarnAboutElementRef[componentName] = !0),
        error(
          "Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release."
        ));
      componentName = this.props.ref;
      return void 0 !== componentName ? componentName : null;
    }
    function ReactElement(type, key, _ref, self, source, owner, props) {
      _ref = props.ref;
      type = {
        $$typeof: REACT_ELEMENT_TYPE,
        type: type,
        key: key,
        props: props,
        _owner: owner
      };
      null !== (void 0 !== _ref ? _ref : null)
        ? Object.defineProperty(type, "ref", {
            enumerable: !1,
            get: elementRefGetterWithDeprecationWarning
          })
        : Object.defineProperty(type, "ref", { enumerable: !1, value: null });
      type._store = {};
      Object.defineProperty(type._store, "validated", {
        configurable: !1,
        enumerable: !1,
        writable: !0,
        value: 0
      });
      Object.defineProperty(type, "_debugInfo", {
        configurable: !1,
        enumerable: !1,
        writable: !0,
        value: null
      });
      Object.freeze && (Object.freeze(type.props), Object.freeze(type));
      return type;
    }
    function jsxDEVImpl(
      type,
      config,
      maybeKey,
      isStaticChildren,
      source,
      self
    ) {
      if (
        "string" === typeof type ||
        "function" === typeof type ||
        type === REACT_FRAGMENT_TYPE ||
        type === REACT_PROFILER_TYPE ||
        (enableDebugTracing && type === REACT_DEBUG_TRACING_MODE_TYPE) ||
        type === REACT_STRICT_MODE_TYPE ||
        type === REACT_SUSPENSE_TYPE ||
        type === REACT_SUSPENSE_LIST_TYPE ||
        type === REACT_LEGACY_HIDDEN_TYPE ||
        type === REACT_OFFSCREEN_TYPE ||
        type === REACT_SCOPE_TYPE ||
        (enableTransitionTracing && type === REACT_TRACING_MARKER_TYPE) ||
        ("object" === typeof type &&
          null !== type &&
          (type.$$typeof === REACT_LAZY_TYPE ||
            type.$$typeof === REACT_MEMO_TYPE ||
            type.$$typeof === REACT_CONTEXT_TYPE ||
            (!enableRenderableContext &&
              type.$$typeof === REACT_PROVIDER_TYPE) ||
            (enableRenderableContext &&
              type.$$typeof === REACT_CONSUMER_TYPE) ||
            type.$$typeof === REACT_FORWARD_REF_TYPE ||
            type.$$typeof === REACT_CLIENT_REFERENCE$1 ||
            void 0 !== type.getModuleId))
      ) {
        var children = config.children;
        if (void 0 !== children)
          if (isStaticChildren)
            if (isArrayImpl(children)) {
              for (
                isStaticChildren = 0;
                isStaticChildren < children.length;
                isStaticChildren++
              )
                validateChildKeys(children[isStaticChildren], type);
              Object.freeze && Object.freeze(children);
            } else
              error(
                "React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead."
              );
          else validateChildKeys(children, type);
      } else {
        children = "";
        if (
          void 0 === type ||
          ("object" === typeof type &&
            null !== type &&
            0 === Object.keys(type).length)
        )
          children +=
            " You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.";
        null === type
          ? (isStaticChildren = "null")
          : isArrayImpl(type)
            ? (isStaticChildren = "array")
            : void 0 !== type && type.$$typeof === REACT_ELEMENT_TYPE
              ? ((isStaticChildren =
                  "<" +
                  (getComponentNameFromType(type.type) || "Unknown") +
                  " />"),
                (children =
                  " Did you accidentally export a JSX literal instead of a component?"))
              : (isStaticChildren = typeof type);
        error(
          "React.jsx: type is invalid -- expected a string (for built-in components) or a class/function (for composite components) but got: %s.%s",
          isStaticChildren,
          children
        );
      }
      if (hasOwnProperty.call(config, "key")) {
        children = getComponentNameFromType(type);
        var keys = Object.keys(config).filter(function (k) {
          return "key" !== k;
        });
        isStaticChildren =
          0 < keys.length
            ? "{key: someKey, " + keys.join(": ..., ") + ": ...}"
            : "{key: someKey}";
        didWarnAboutKeySpread[children + isStaticChildren] ||
          ((keys =
            0 < keys.length ? "{" + keys.join(": ..., ") + ": ...}" : "{}"),
          error(
            'A props object containing a "key" prop is being spread into JSX:\n  let props = %s;\n  <%s {...props} />\nReact keys must be passed directly to JSX without using spread:\n  let props = %s;\n  <%s key={someKey} {...props} />',
            isStaticChildren,
            children,
            keys,
            children
          ),
          (didWarnAboutKeySpread[children + isStaticChildren] = !0));
      }
      children = null;
      void 0 !== maybeKey &&
        (checkKeyStringCoercion(maybeKey), (children = "" + maybeKey));
      hasValidKey(config) &&
        (checkKeyStringCoercion(config.key), (children = "" + config.key));
      hasValidRef(config) &&
        (disableStringRefs ||
          warnIfStringRefCannotBeAutoConverted(config, self));
      if (
        (!enableFastJSXWithoutStringRefs && "ref" in config) ||
        "key" in config
      ) {
        maybeKey = {};
        for (var propName in config)
          "key" !== propName &&
            (disableStringRefs || "ref" !== propName
              ? (maybeKey[propName] = config[propName])
              : (maybeKey.ref = coerceStringRef(
                  config[propName],
                  getOwner(),
                  type
                )));
      } else maybeKey = config;
      if (!disableDefaultPropsExceptForClasses && type && type.defaultProps) {
        config = type.defaultProps;
        for (var _propName2 in config)
          void 0 === maybeKey[_propName2] &&
            (maybeKey[_propName2] = config[_propName2]);
      }
      children &&
        ((_propName2 =
          "function" === typeof type
            ? type.displayName || type.name || "Unknown"
            : type),
        children && defineKeyPropWarningGetter(maybeKey, _propName2));
      return ReactElement(
        type,
        children,
        null,
        self,
        source,
        getOwner(),
        maybeKey
      );
    }
    function validateChildKeys(node, parentType) {
      if (
        "object" === typeof node &&
        node &&
        node.$$typeof !== REACT_CLIENT_REFERENCE
      )
        if (isArrayImpl(node))
          for (var i = 0; i < node.length; i++) {
            var child = node[i];
            isValidElement(child) && validateExplicitKey(child, parentType);
          }
        else if (isValidElement(node))
          node._store && (node._store.validated = 1);
        else if (
          (null === node || "object" !== typeof node
            ? (i = null)
            : ((i =
                (MAYBE_ITERATOR_SYMBOL && node[MAYBE_ITERATOR_SYMBOL]) ||
                node["@@iterator"]),
              (i = "function" === typeof i ? i : null)),
          "function" === typeof i &&
            i !== node.entries &&
            ((i = i.call(node)), i !== node))
        )
          for (; !(node = i.next()).done; )
            isValidElement(node.value) &&
              validateExplicitKey(node.value, parentType);
    }
    function isValidElement(object) {
      return (
        "object" === typeof object &&
        null !== object &&
        object.$$typeof === REACT_ELEMENT_TYPE
      );
    }
    function validateExplicitKey(element, parentType) {
      if (
        element._store &&
        !element._store.validated &&
        null == element.key &&
        ((element._store.validated = 1),
        (parentType = getCurrentComponentErrorInfo(parentType)),
        !ownerHasKeyUseWarning[parentType])
      ) {
        ownerHasKeyUseWarning[parentType] = !0;
        var childOwner = "";
        element &&
          null != element._owner &&
          element._owner !== getOwner() &&
          ((childOwner = null),
          "number" === typeof element._owner.tag
            ? (childOwner = getComponentNameFromType(element._owner.type))
            : "string" === typeof element._owner.name &&
              (childOwner = element._owner.name),
          (childOwner = " It was passed a child from " + childOwner + "."));
        var prevGetCurrentStack = ReactSharedInternals.getCurrentStack;
        ReactSharedInternals.getCurrentStack = function () {
          var stack = describeUnknownElementTypeFrameInDEV(element.type);
          prevGetCurrentStack && (stack += prevGetCurrentStack() || "");
          return stack;
        };
        error(
          'Each child in a list should have a unique "key" prop.%s%s See https://react.dev/link/warning-keys for more information.',
          parentType,
          childOwner
        );
        ReactSharedInternals.getCurrentStack = prevGetCurrentStack;
      }
    }
    function getCurrentComponentErrorInfo(parentType) {
      var info = "",
        owner = getOwner();
      owner &&
        (owner = getComponentNameFromType(owner.type)) &&
        (info = "\n\nCheck the render method of `" + owner + "`.");
      info ||
        ((parentType = getComponentNameFromType(parentType)) &&
          (info =
            "\n\nCheck the top-level render call using <" + parentType + ">."));
      return info;
    }
    function coerceStringRef(mixedRef, owner, type) {
      if (disableStringRefs) return mixedRef;
      if ("string" !== typeof mixedRef)
        if ("number" === typeof mixedRef || "boolean" === typeof mixedRef)
          willCoercionThrow(mixedRef) &&
            (error(
              "The provided `%s` prop is an unsupported type %s. This value must be coerced to a string before using it here.",
              "ref",
              typeName(mixedRef)
            ),
            testStringCoercion(mixedRef)),
            (mixedRef = "" + mixedRef);
        else return mixedRef;
      var callback = stringRefAsCallbackRef.bind(null, mixedRef, type, owner);
      callback.__stringRef = mixedRef;
      callback.__type = type;
      callback.__owner = owner;
      return callback;
    }
    function stringRefAsCallbackRef(stringRef, type, owner, value) {
      if (!disableStringRefs) {
        if (!owner)
          throw Error(
            "Element ref was specified as a string (" +
              stringRef +
              ") but no owner was set. This could happen for one of the following reasons:\n1. You may be adding a ref to a function component\n2. You may be adding a ref to a component that was not created inside a component's render method\n3. You have multiple copies of React loaded\nSee https://react.dev/link/refs-must-have-owner for more information."
          );
        if (1 !== owner.tag)
          throw Error(
            "Function components cannot have string refs. We recommend using useRef() instead. Learn more about using refs safely here: https://react.dev/link/strict-mode-string-ref"
          );
        if (
          "function" !== typeof type ||
          (type.prototype && type.prototype.isReactComponent)
        )
          (type = getComponentNameFromFiber(owner) || "Component"),
            didWarnAboutStringRefs[type] ||
              (enableLogStringRefsProd &&
                enableLogStringRefsProd(type, stringRef),
              error(
                'Component "%s" contains the string ref "%s". Support for string refs will be removed in a future major release. We recommend using useRef() or createRef() instead. Learn more about using refs safely here: https://react.dev/link/strict-mode-string-ref',
                type,
                stringRef
              ),
              (didWarnAboutStringRefs[type] = !0));
        owner = owner.stateNode;
        if (!owner)
          throw Error(
            "Missing owner for string ref " +
              stringRef +
              ". This error is likely caused by a bug in React. Please file an issue."
          );
        owner = owner.refs;
        null === value ? delete owner[stringRef] : (owner[stringRef] = value);
      }
    }
    var React = require("react"),
      dynamicFeatureFlags = require("ReactFeatureFlags"),
      disableDefaultPropsExceptForClasses =
        dynamicFeatureFlags.disableDefaultPropsExceptForClasses,
      disableStringRefs = dynamicFeatureFlags.disableStringRefs,
      enableDebugTracing = dynamicFeatureFlags.enableDebugTracing,
      enableLogStringRefsProd = dynamicFeatureFlags.enableLogStringRefsProd,
      enableRenderableContext = dynamicFeatureFlags.enableRenderableContext,
      enableTransitionTracing = dynamicFeatureFlags.enableTransitionTracing;
    dynamicFeatureFlags = dynamicFeatureFlags.renameElementSymbol;
    var REACT_LEGACY_ELEMENT_TYPE = Symbol.for("react.element"),
      REACT_ELEMENT_TYPE = dynamicFeatureFlags
        ? Symbol.for("react.transitional.element")
        : REACT_LEGACY_ELEMENT_TYPE,
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
      REACT_LAZY_TYPE = Symbol.for("react.lazy"),
      REACT_SCOPE_TYPE = Symbol.for("react.scope"),
      REACT_DEBUG_TRACING_MODE_TYPE = Symbol.for("react.debug_trace_mode"),
      REACT_OFFSCREEN_TYPE = Symbol.for("react.offscreen"),
      REACT_LEGACY_HIDDEN_TYPE = Symbol.for("react.legacy_hidden"),
      REACT_TRACING_MARKER_TYPE = Symbol.for("react.tracing_marker"),
      MAYBE_ITERATOR_SYMBOL = Symbol.iterator,
      warningWWW = require("warning"),
      REACT_CLIENT_REFERENCE$2 = Symbol.for("react.client.reference"),
      ReactSharedInternals =
        React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,
      hasOwnProperty = Object.prototype.hasOwnProperty,
      assign = Object.assign,
      REACT_CLIENT_REFERENCE$1 = Symbol.for("react.client.reference"),
      isArrayImpl = Array.isArray,
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
    var REACT_CLIENT_REFERENCE = Symbol.for("react.client.reference"),
      specialPropKeyWarningShown;
    var didWarnAboutStringRefs = {};
    var didWarnAboutElementRef = {};
    var enableFastJSXWithoutStringRefs = disableStringRefs,
      didWarnAboutKeySpread = {},
      ownerHasKeyUseWarning = {};
    exports.Fragment = REACT_FRAGMENT_TYPE;
    exports.jsxDEV = function (
      type,
      config,
      maybeKey,
      isStaticChildren,
      source,
      self
    ) {
      return jsxDEVImpl(type, config, maybeKey, isStaticChildren, source, self);
    };
  })();
